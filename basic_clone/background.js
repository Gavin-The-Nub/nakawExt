// Basic clone background service worker
// - Per-tab DNR rules to force mobile UA
// - Inject/remove scrollbar CSS

const DEVICES = [
  {
    slug: "iphone-15-pro",
    name: "iPhone 15 Pro",
    viewport: { width: 440, height: 956 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "iphone-15-pro-mockup.png",
  },
  {
    slug: "macbook-pro",
    name: "MacBook Pro",
    viewport: { width: 750, height: 431 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "macbook-pro-mockup.png",
  },
];

function getDeviceBySlug(slug) {
  return DEVICES.find((d) => d.slug === slug) || DEVICES[0];
}

// Simple storage for per-tab state
// { [tabId]: { mobile: boolean, showScrollbar: boolean } }
const tabState = {};

function storageArea() {
  // Prefer session storage when available; fall back to local
  return chrome.storage && chrome.storage.session
    ? chrome.storage.session
    : chrome.storage.local;
}

function stateKey(tabId) {
  return `tabState_${tabId}`;
}

async function loadState(tabId) {
  const key = stateKey(tabId);
  const area = storageArea();
  const data = await area.get(key);
  const state = data[key] || {
    mobile: true, // Changed default to true
    showScrollbar: false, // Changed default to false
    simulator: true, // Changed default to true - auto-show simulator
    deviceSlug: "iphone-15-pro", // Set iPhone 15 Pro as default
  };
  tabState[tabId] = state;
  return state;
}

async function saveState(tabId) {
  const key = stateKey(tabId);
  const area = storageArea();
  const value = {};
  value[key] = tabState[tabId] || {
    mobile: true, // Changed default to true
    showScrollbar: false, // Changed default to false
    simulator: true, // Changed default to true - auto-show simulator
    deviceSlug: "iphone-15-pro", // Set iPhone 15 Pro as default
  };
  await area.set(value);
}

async function removeState(tabId) {
  const key = stateKey(tabId);
  const area = storageArea();
  await area.remove(key);
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return i;
}

function ruleIdsForTab(tabId) {
  // Ensure stable unique 32-bit integer rule IDs per tab
  const base = toInt(tabId, 0) | 0; // force 32-bit
  const reqRuleId = (base << 2) + 101;
  const resRuleId = (base << 2) + 102;
  return { reqRuleId: toInt(reqRuleId), resRuleId: toInt(resRuleId) };
}

async function enableMobileHeaders(tabId) {
  const { reqRuleId, resRuleId } = ruleIdsForTab(tabId);
  const state = await loadState(tabId);
  const device = getDeviceBySlug(state.deviceSlug);
  try {
    const removeIds = [toInt(reqRuleId), toInt(resRuleId)].filter(
      (id) => Number.isInteger(id) && id > 0
    );
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: removeIds,
      addRules: [
        {
          id: toInt(reqRuleId),
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              { header: "user-agent", operation: "set", value: device.ua },
              { header: "sec-ch-ua", operation: "remove" },
              { header: "sec-ch-ua-arch", operation: "remove" },
              { header: "sec-ch-ua-bitness", operation: "remove" },
              { header: "sec-ch-ua-full-version-list", operation: "remove" },
              { header: "sec-ch-ua-model", operation: "remove" },
              { header: "sec-ch-ua-platform-version", operation: "remove" },
              { header: "sec-ch-ua-mobile", operation: "set", value: "?1" },
              {
                header: "sec-ch-ua-platform",
                operation: "set",
                value: device.platform === "iOS" ? "iOS" : "Android",
              },
            ],
          },
          condition: {
            tabIds: [toInt(tabId)].filter((v) => Number.isInteger(v)),
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "object",
              "xmlhttprequest",
              "other",
            ],
          },
        },
        {
          id: toInt(resRuleId),
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [
              { header: "content-security-policy", operation: "remove" },
              { header: "x-frame-options", operation: "remove" },
            ],
          },
          condition: {
            tabIds: [toInt(tabId)].filter((v) => Number.isInteger(v)),
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "object",
              "xmlhttprequest",
              "other",
            ],
          },
        },
      ],
    });
  } catch (err) {
    console.error("enableMobileHeaders error", err);
  }
}

async function disableMobileHeaders(tabId) {
  const { reqRuleId, resRuleId } = ruleIdsForTab(tabId);
  try {
    const removeIds = [toInt(reqRuleId), toInt(resRuleId)].filter(
      (id) => Number.isInteger(id) && id > 0
    );
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: removeIds,
    });
  } catch (err) {
    console.error("disableMobileHeaders error", err);
  }
}

// Remove Debugger UA override approach to avoid banner

function toMobileUrlIfLikely(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname;
    if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host))
      return urlString;
    if (host.startsWith("m.")) return urlString;
    // Do not force m. automatically; respect existing URL
    return urlString;
  } catch (_) {}
  return urlString;
}

async function applyScrollbar(tabId, show) {
  // inject CSS that properly controls scrollbar visibility
  let css;
  if (show) {
    // Show scrollbar with proper styling
    css = `
      html, body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      ::-webkit-scrollbar {
        background: transparent;
        width: 13px !important;
        height: 13px !important;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.4);
        border: solid 3px transparent;
        background-clip: content-box;
        border-radius: 17px;
      }
    `;
  } else {
    // Completely hide scrollbar but keep scrolling functional
    css = `
      html, body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      ::-webkit-scrollbar {
        background: transparent;
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
        display: none !important;
      }
      ::-webkit-scrollbar-thumb {
        background: transparent;
        display: none !important;
      }
      ::-webkit-scrollbar-corner {
        background: transparent;
        display: none !important;
      }
      ::-webkit-scrollbar-button {
        display: none !important;
      }
    `;
  }
  
  try {
    // Remove any existing scrollbar CSS first
    await chrome.scripting.removeCSS({
      target: { tabId, allFrames: true },
      css: "html,body{overflow-y:auto !important;overflow-x:hidden !important}::-webkit-scrollbar{background:transparent;width:13px !important;height:13px !important}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.4);border:solid 3px transparent;background-clip:content-box;border-radius:17px}",
    });
  } catch (_) {}
  
  try {
    await chrome.scripting.removeCSS({
      target: { tabId, allFrames: true },
      css: "html,body{overflow-y:auto !important;overflow-x:hidden !important}::-webkit-scrollbar{background:transparent;width:0 !important;height:0 !important}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:transparent}",
    });
  } catch (_) {}

  await chrome.scripting.insertCSS({
    target: { tabId, allFrames: true },
    css,
  });
}

async function showSimulator(tabId, state) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      css: `
        #__mf_simulator_overlay__{position:fixed;inset:0;background:#111;z-index:2147483647;display:flex;align-items:center;justify-content:center}
        #__mf_simulator_frame__{position:relative;display:inline-block;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3)}
        #__mf_simulator_close__{position:fixed;top:10px;right:10px;z-index:2147483647;background:#333;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;font-family:system-ui,sans-serif}
        #__mf_simulator_close__:hover{background:#555}
        
        /* Completely hide main page scrollbar when simulator is active */
        html, body {
          overflow: hidden !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        ::-webkit-scrollbar-track {
          display: none !important;
        }
        ::-webkit-scrollbar-thumb {
          display: none !important;
        }
        ::-webkit-scrollbar-corner {
          display: none !important;
        }
        ::-webkit-scrollbar-button {
          display: none !important;
        }
      `,
    });
  } catch (_) {}
  
  const device = getDeviceBySlug(state.deviceSlug);
  const tab = await chrome.tabs.get(tabId);

  await chrome.scripting.executeScript({
    target: { tabId },
    func: ({ w, h, deviceName, mockupPath }) => {
      const prev = document.getElementById("__mf_simulator_overlay__");
      if (prev) prev.remove();

      const overlay = document.createElement("div");
      overlay.id = "__mf_simulator_overlay__";

      // Create mockup container with proper styling
      const mockupContainer = document.createElement("div");
      mockupContainer.id = "__mf_simulator_frame__";
      mockupContainer.style.position = "relative";
      mockupContainer.style.display = "inline-block";
      mockupContainer.style.width = String(w) + "px";
      mockupContainer.style.height = String(h) + "px";
      mockupContainer.style.scale = "0.7";

      // Create mockup image with proper sizing
      const mockupImg = document.createElement("img");
      mockupImg.src = chrome.runtime.getURL(mockupPath);
      mockupImg.style.width = String(w) + "px";
      mockupImg.style.height = String(h) + "px";
      mockupImg.style.display = "block";
      mockupImg.style.position = "absolute";
      mockupImg.style.top = "0";
      mockupImg.style.left = "0";
      mockupImg.style.zIndex = "2";
      mockupImg.style.pointerEvents = "none";

      // Create iframe with proper content area positioning and hidden scrollbars
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.border = "none";
      iframe.style.background = "transparent";
      iframe.style.width = String(w) + "px";
      iframe.style.height = String(h) + "px";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.zIndex = "1";
      iframe.sandbox = "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups";
      iframe.src = window.location.href;
      
      // Add CSS to iframe to hide scrollbars after it loads
      iframe.onload = function() {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const style = iframeDoc.createElement('style');
          style.textContent = `
            html, body {
              overflow-y: auto !important;
              overflow-x: hidden !important;
            }
            ::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            ::-webkit-scrollbar-track {
              display: none !important;
            }
            ::-webkit-scrollbar-thumb {
              display: none !important;
            }
            ::-webkit-scrollbar-corner {
              display: none !important;
            }
            ::-webkit-scrollbar-button {
              display: none !important;
            }
          `;
          iframeDoc.head.appendChild(style);
        } catch (e) {
          // Cross-origin iframe, can't inject CSS
          console.log("Cannot inject CSS into cross-origin iframe");
        }
      };

      mockupContainer.appendChild(iframe);
      mockupContainer.appendChild(mockupImg);

      const close = document.createElement("button");
      close.id = "__mf_simulator_close__";
      close.textContent = "Close";
      close.onclick = () => {
        overlay.remove();
        // Restore main page scrolling
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        // Also remove the CSS
        const style = document.querySelector('style[data-simulator-css]');
        if (style) style.remove();
      };

      overlay.appendChild(mockupContainer);
      document.body.appendChild(overlay);
      document.body.appendChild(close);
    },
    args: [
      {
        w: device.viewport.width,
        h: device.viewport.height,
        deviceName: device.name,
        mockupPath: device.mockup,
      },
    ],
  });
}

async function hideSimulator(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const el = document.getElementById("__mf_simulator_overlay__");
      const btn = document.getElementById("__mf_simulator_close__");
      if (el) el.remove();
      if (btn) btn.remove();
      
      // Restore main page scrolling
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    },
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg && msg.type === "TOGGLE_MOBILE_FOR_TAB") {
      const tabId = msg.tabId;
      await loadState(tabId);
      tabState[tabId].mobile = !tabState[tabId].mobile;
      if (tabState[tabId].mobile) await enableMobileHeaders(tabId);
      else await disableMobileHeaders(tabId);
      await saveState(tabId);
      try {
        const tab = await chrome.tabs.get(tabId);
        const targetUrl = toMobileUrlIfLikely(tab.url);
        if (targetUrl !== tab.url) {
          await chrome.tabs.update(tabId, { url: targetUrl });
        } else {
          await chrome.tabs.reload(tabId);
        }
      } catch (_) {}
      sendResponse({ mobile: tabState[tabId].mobile });
      return;
    }
    if (msg && msg.type === "TOGGLE_SCROLLBAR_FOR_TAB") {
      const tabId = msg.tabId;
      await loadState(tabId);
      tabState[tabId].showScrollbar = !tabState[tabId].showScrollbar;
      await applyScrollbar(tabId, tabState[tabId].showScrollbar);
      await saveState(tabId);
      sendResponse({ 
        showScrollbar: tabState[tabId].showScrollbar,
        mobile: tabState[tabId].mobile,
        simulator: tabState[tabId].simulator,
        deviceSlug: tabState[tabId].deviceSlug
      });
      return;
    }
    if (msg && msg.type === "GET_TAB_STATE") {
      const tabId = msg.tabId;
      const state = await loadState(tabId);
      sendResponse({
        mobile: state.mobile,
        showScrollbar: state.showScrollbar,
        deviceSlug: state.deviceSlug,
        simulator: state.simulator,
      });
      return;
    }
    if (msg && msg.type === "SET_DEVICE_FOR_TAB") {
      const { tabId, deviceSlug } = msg;
      await loadState(tabId);
      tabState[tabId].deviceSlug = deviceSlug;
      await saveState(tabId);
      if (tabState[tabId].mobile) {
        // re-apply UA with the new device
        await enableMobileHeaders(tabId);
      }
      // Refresh simulator with new device if it's active
      if (tabState[tabId].simulator) {
        await showSimulator(tabId, tabState[tabId]);
      }
      sendResponse({ ok: true });
      return;
    }
    if (msg && msg.type === "TOGGLE_SIMULATOR_FOR_TAB") {
      const { tabId } = msg;
      const state = await loadState(tabId);
      state.simulator = !state.simulator;
      tabState[tabId] = state;
      await saveState(tabId);
      if (state.simulator) {
        try {
          await showSimulator(tabId, state);
        } catch (_) {}
      } else {
        try {
          await hideSimulator(tabId);
        } catch (_) {}
      }
      sendResponse({ 
        simulator: state.simulator,
        mobile: state.mobile,
        showScrollbar: state.showScrollbar,
        deviceSlug: state.deviceSlug
      });
      return;
    }
    if (msg && msg.type === "ACTIVATE_SIMULATOR_FOR_TAB") {
      const { tabId } = msg;
      const state = await loadState(tabId);
      // Ensure simulator is enabled and show it ONLY for this tab
      state.simulator = true;
      state.showScrollbar = false; // Always hide scrollbars
      tabState[tabId] = state;
      await saveState(tabId);
      try {
        await showSimulator(tabId, state);
        // Apply hidden scrollbars
        await applyScrollbar(tabId, false);
      } catch (_) {}
      sendResponse({ 
        simulator: state.simulator,
        mobile: state.mobile,
        showScrollbar: state.showScrollbar,
        deviceSlug: state.deviceSlug
      });
      return;
    }
  })();
  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  delete tabState[tabId];
  await disableMobileHeaders(tabId);
  await removeState(tabId);
});

// Re-apply settings after reloads/navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.status) return;

  // Only apply settings if this tab has been explicitly activated
  if (!tabState[tabId]) return;

  // Re-apply settings on complete only for activated tabs
  if (changeInfo.status === "complete") {
    const state = await loadState(tabId);
    if (state.mobile) {
      await enableMobileHeaders(tabId);
    }
    if (state.showScrollbar) {
      await applyScrollbar(tabId, true);
    }
    // Auto-show simulator if it's enabled (which it is by default)
    if (state.simulator) {
      await showSimulator(tabId, state);
    }
  }
});

// Remove automatic application to all tabs on startup/installation
// Only apply to tabs that have been explicitly activated
async function reapplyActivatedTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      // Only reapply if this tab has been explicitly activated
      if (tabState[t.id]) {
        const state = await loadState(t.id);
        if (state.mobile) await enableMobileHeaders(t.id);
        if (state.showScrollbar) await applyScrollbar(t.id, true);
        if (state.simulator) await showSimulator(t.id, state);
      }
    }
  } catch (_) {}
}

chrome.runtime.onStartup.addListener(reapplyActivatedTabs);
chrome.runtime.onInstalled.addListener(reapplyActivatedTabs);
