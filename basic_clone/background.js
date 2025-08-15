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
    screenPct: { top: 2.2, right: 5.6, bottom:2.2, left: 5.4, radius: 8.0 },
  },
  {
    slug: "macbook-pro",
    name: "MacBook Pro",
    viewport: { width: 1280, height: 800 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "macbook-pro-mockup.png",
    screenPct: { top: 8.0, right: 7.4, bottom: 8.0, left: 7.4, radius: 1.0 },
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
    func: ({ w, h, deviceName, mockupPath, deviceScreenPct }) => {
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
      mockupContainer.style.overflow = "hidden";

      // Create mockup image with proper sizing (will sit below content)
      const mockupImg = document.createElement("img");
      mockupImg.src = chrome.runtime.getURL(mockupPath);
      mockupImg.style.width = String(w) + "px";
      mockupImg.style.height = String(h) + "px";
      mockupImg.style.display = "block";
      mockupImg.style.position = "absolute";
      mockupImg.style.top = "0";
      mockupImg.style.left = "0";
      mockupImg.style.zIndex = "5"; // mockup above iframe for bezel overlay
      mockupImg.style.pointerEvents = "none";

      // Screen container that clips the iframe to the device screen area using percentage insets
      const pct = deviceScreenPct || { top: 10, right: 6, bottom: 10, left: 6, radius: 3 };
      const preset = {
        x: Math.round((pct.left / 100) * w),
        y: Math.round((pct.top / 100) * h),
        w: Math.max(0, Math.round(w - ((pct.left + pct.right) / 100) * w)),
        h: Math.max(0, Math.round(h - ((pct.top + pct.bottom) / 100) * h)),
        radius: Math.round((pct.radius / 100) * Math.min(w, h))
      };

      const iframeContainer = document.createElement("div");
      iframeContainer.style.position = "absolute";
      iframeContainer.style.top = String(preset.y) + "px";
      iframeContainer.style.left = String(preset.x) + "px";
      iframeContainer.style.width = String(preset.w) + "px";
      iframeContainer.style.height = String(preset.h) + "px";
      iframeContainer.style.overflow = "hidden"; // critical for clipping
      iframeContainer.style.borderRadius = String(preset.radius) + "px";

      // Build an SVG clipPath so we can support more complex shapes later (e.g., notches)
      const maskId = "__mf_viewport_mask__" + Math.random().toString(36).slice(2);
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      const defs = document.createElementNS(svgNS, "defs");
      const clip = document.createElementNS(svgNS, "clipPath");
      clip.setAttribute("id", maskId);
      // Use userSpaceOnUse so the rect dimensions match the element's pixel box
      clip.setAttribute("clipPathUnits", "userSpaceOnUse");
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", String(preset.w));
      rect.setAttribute("height", String(preset.h));
      rect.setAttribute("rx", String(preset.radius));
      rect.setAttribute("ry", String(preset.radius));
      clip.appendChild(rect);
      defs.appendChild(clip);
      svg.appendChild(defs);
      overlay.appendChild(svg);

      // Apply the clip-path via URL reference
      iframeContainer.style.clipPath = `url(#${maskId})`;
      iframeContainer.style.webkitClipPath = `url(#${maskId})`;
      iframeContainer.style.zIndex = "1"; // behind mockup, acts as clipping area

      // Create iframe positioned to fill the screen container
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.border = "none";
      iframe.style.background = "transparent";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.zIndex = "2"; // below mockup, above container background
      iframe.sandbox = "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups";
      iframe.src = window.location.href;
      
      // Add CSS to iframe to hide scrollbars after it loads
      iframe.onload = function() {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const style = iframeDoc.createElement('style');
          style.textContent = `
            html, body {
              overflow: auto !important;
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

      iframeContainer.appendChild(iframe);
      mockupContainer.appendChild(mockupImg);
      mockupContainer.appendChild(iframeContainer);

      // Create portrait navigation bar on the right side
      const navBar = document.createElement("div");
      navBar.id = "__mf_simulator_nav__";
      navBar.style.position = "fixed";
      navBar.style.right = "20px";
      navBar.style.top = "50%";
      navBar.style.transform = "translateY(-50%)";
      navBar.style.display = "flex";
      navBar.style.flexDirection = "column";
      navBar.style.gap = "15px";
      navBar.style.zIndex = "2147483648";
      navBar.style.alignItems = "center";

      // Close button
      const closeBtn = document.createElement("button");
      closeBtn.id = "__mf_simulator_close_btn__";
      closeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      closeBtn.style.width = "50px";
      closeBtn.style.height = "50px";
      closeBtn.style.borderRadius = "50%";
      closeBtn.style.background = "rgba(51, 51, 51, 0.9)";
      closeBtn.style.border = "none";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.display = "flex";
      closeBtn.style.alignItems = "center";
      closeBtn.style.justifyContent = "center";
      closeBtn.style.transition = "all 0.2s ease";
      closeBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
      
      closeBtn.onmouseenter = () => {
        closeBtn.style.background = "rgba(85, 85, 85, 0.9)";
        closeBtn.style.transform = "scale(1.1)";
      };
      
      closeBtn.onmouseleave = () => {
        closeBtn.style.background = "rgba(51, 51, 51, 0.9)";
        closeBtn.style.transform = "scale(1)";
      };
      
      closeBtn.onclick = () => {
        // Immediate UI cleanup
        overlay.remove();
        navBar.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";

        // Ask background to fully deactivate for this tab
        try {
          chrome.runtime.sendMessage({ type: "DEACTIVATE_FOR_TAB" });
        } catch (_) {}
      };

      // Change device button
      const deviceBtn = document.createElement("button");
      deviceBtn.id = "__mf_simulator_device_btn__";
      deviceBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 18H12.01M8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21ZM12 18C12 18.5523 11.5523 19 11 19C10.4477 19 10 18.5523 10 18C10 17.4477 10.4477 17 11 17C11.5523 17 12 17.4477 12 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      deviceBtn.style.width = "50px";
      deviceBtn.style.height = "50px";
      deviceBtn.style.borderRadius = "50%";
      deviceBtn.style.background = "rgba(51, 51, 51, 0.9)";
      deviceBtn.style.border = "none";
      deviceBtn.style.cursor = "pointer";
      deviceBtn.style.display = "flex";
      deviceBtn.style.alignItems = "center";
      deviceBtn.style.justifyContent = "center";
      deviceBtn.style.transition = "all 0.2s ease";
      deviceBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
      
      deviceBtn.onmouseenter = () => {
        deviceBtn.style.background = "rgba(85, 85, 85, 0.9)";
        deviceBtn.style.transform = "scale(1.1)";
      };
      
      deviceBtn.onmouseleave = () => {
        deviceBtn.style.background = "rgba(51, 51, 51, 0.9)";
        deviceBtn.style.transform = "scale(1)";
      };
      
      deviceBtn.onclick = () => {
        // Toggle between devices
        const currentDevice = deviceName === "iPhone 15 Pro" ? "macbook-pro" : "iphone-15-pro";
        
        // Update the device icon based on selection
        if (currentDevice === "macbook-pro") {
          deviceBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 18H12.01M8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21ZM12 18C12 18.5523 11.5523 19 11 19C10.4477 19 10 18.5523 10 18C10 17.4477 10.4477 17 11 17C11.5523 17 12 17.4477 12 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        } else {
          deviceBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 18H12.01M8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21ZM12 18C12 18.5523 11.5523 19 11 19C10.4477 19 10 18.5523 10 18C10 17.4477 10.4477 17 11 17C11.5523 17 12 17.4477 12 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        }
        
        // Send message directly to background script
        chrome.runtime.sendMessage({
          type: "DEVICE_CHANGE_REQUEST",
          deviceSlug: currentDevice
        });
      };

      // Add buttons to navigation bar
      navBar.appendChild(closeBtn);
      navBar.appendChild(deviceBtn);



      overlay.appendChild(mockupContainer);
      document.body.appendChild(overlay);
      document.body.appendChild(navBar);
    },
    args: [
      {
        w: device.viewport.width,
        h: device.viewport.height,
        deviceName: device.name,
        mockupPath: device.mockup,
        deviceScreenPct: device.screenPct,
      },
    ],
  });
}

async function hideSimulator(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const el = document.getElementById("__mf_simulator_overlay__");
      const navBar = document.getElementById("__mf_simulator_nav__");
      if (el) el.remove();
      if (navBar) navBar.remove();
      
      // Restore main page scrolling
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    },
  });
}

// Listen for device change requests from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg && msg.type === "DEACTIVATE_FOR_TAB") {
      try {
        const tabId = sender?.tab?.id;
        if (typeof tabId === "number") {
          // Load and mark simulator off; clear state so we don't auto-apply
          const state = await loadState(tabId);
          state.simulator = false;
          state.showScrollbar = false;
          tabState[tabId] = state;
          await saveState(tabId);

          // Remove overlays/UI and CSS
          await hideSimulator(tabId);
          await applyScrollbar(tabId, false);

          // Remove UA/header overrides
          await disableMobileHeaders(tabId);

          // Finally, remove state so reapply on updated/startup won't trigger
          delete tabState[tabId];
          await removeState(tabId);
        }
      } catch (e) {
        console.error("DEACTIVATE_FOR_TAB error", e);
      }
      sendResponse({ ok: true });
      return;
    }
    if (msg && msg.type === "DEVICE_CHANGE_REQUEST") {
      const tabId = sender.tab.id;
      const deviceSlug = msg.deviceSlug;
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
