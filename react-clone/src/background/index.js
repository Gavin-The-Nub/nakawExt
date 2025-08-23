import { DEVICES, getDeviceBySlug } from "../shared/devices.js";

// Store tab states
const tabStates = new Map();

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Mobile Device Simulator Extension installed");

  // Set up context menu
  chrome.contextMenus.create({
    id: "toggle-simulator",
    title: "Toggle Device Simulator",
    contexts: ["page"],
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, tabId, deviceSlug } = message;

  switch (type) {
    case "ACTIVATE_SIMULATOR_FOR_TAB":
      activateSimulatorForTab(tabId, deviceSlug);
      break;

    case "DEACTIVATE_SIMULATOR_FOR_TAB":
      deactivateSimulatorForTab(tabId);
      break;

    case "SET_DEVICE_FOR_TAB":
      setDeviceForTab(tabId, deviceSlug);
      break;

    case "GET_TAB_STATE":
      sendResponse(getTabState(tabId));
      break;

    case "TOGGLE_SCROLLBAR_FOR_TAB":
      toggleScrollbarForTab(tabId, sendResponse);
      break;

    default:
      console.warn("Unknown message type:", type);
  }

  return true; // Keep message channel open for async responses
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-simulator") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tabState = getTabState(tabs[0].id);
        if (tabState.isActive) {
          deactivateSimulatorForTab(tabs[0].id);
        } else {
          activateSimulatorForTab(tabs[0].id);
        }
      }
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggle-simulator") {
    const tabState = getTabState(tab.id);
    if (tabState.isActive) {
      deactivateSimulatorForTab(tab.id);
    } else {
      activateSimulatorForTab(tab.id);
    }
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    const tabState = getTabState(tabId);
    if (tabState.isActive) {
      // Re-apply device simulation after page load
      applyDeviceToTab(tabId, tabState.device);
    }
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Core functions
function activateSimulatorForTab(tabId, deviceSlug = null) {
  const device = deviceSlug ? getDeviceBySlug(deviceSlug) : getDefaultDevice();

  const tabState = {
    isActive: true,
    device: device,
    showScrollbar: false,
    originalUA: null,
  };

  tabStates.set(tabId, tabState);
  applyDeviceToTab(tabId, device);
  showSimulator(tabId, tabState);

  console.log("Device simulator activated:", device.name);
}

function deactivateSimulatorForTab(tabId) {
  const tabState = getTabState(tabId);
  if (tabState && tabState.isActive) {
    // Restore original user agent
    if (tabState.originalUA) {
      chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [tabId],
      });
    }

    // Remove simulator overlay
    hideSimulator(tabId);

    tabStates.delete(tabId);
    console.log("Device simulator deactivated");
  }
}

function setDeviceForTab(tabId, deviceSlug) {
  const device = getDeviceBySlug(deviceSlug);
  const tabState = getTabState(tabId);

  if (tabState && tabState.isActive) {
    tabState.device = device;
    applyDeviceToTab(tabId, device);
    showSimulator(tabId, tabState);

    console.log("Device changed to:", device.name);
  }
}

function applyDeviceToTab(tabId, device) {
  // Set up user agent spoofing
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [tabId],
    addRules: [
      {
        id: tabId,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "User-Agent",
              operation: "set",
              value: device.ua,
            },
          ],
        },
        condition: {
          tabIds: [tabId],
          resourceTypes: ["main_frame"],
        },
      },
    ],
  });

  // Store original UA if not already stored
  const tabState = getTabState(tabId);
  if (tabState && !tabState.originalUA) {
    chrome.tabs.get(tabId, (tab) => {
      if (tab) {
        tabState.originalUA = tab.userAgent;
      }
    });
  }
}

function getTabState(tabId) {
  return (
    tabStates.get(tabId) || {
      isActive: false,
      device: getDefaultDevice(),
      showScrollbar: false,
    }
  );
}

function toggleScrollbarForTab(tabId, sendResponse) {
  const tabState = getTabState(tabId);
  if (tabState) {
    tabState.showScrollbar = !tabState.showScrollbar;
    applyScrollbar(tabId, tabState.showScrollbar);
    sendResponse(tabState);
  }
}

async function showSimulator(tabId, state) {
  try {
    // Inject the device panel content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["devicePanel.js"],
    });

    await chrome.scripting.insertCSS({
      target: { tabId },
      css: `
        #__mf_simulator_overlay__ {
          position: fixed;
          inset: 0;
          background: #FFFF;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #__mf_simulator_frame__ {
          position: relative;
          display: inline-block;
          overflow: hidden;
          background: transparent;
        }
        
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
  } catch (error) {
    console.error("Failed to inject simulator:", error);
  }

  const device = state.device;
  const tab = await chrome.tabs.get(tabId);

  await chrome.scripting.executeScript({
    target: { tabId },
    func: createSimulatorOverlay,
    args: [
      {
        w: device.viewport.width,
        h: device.viewport.height,
        deviceName: device.name,
        mockupPath: device.mockup,
        deviceScreenPct: device.screenPct,
        orientation: "portrait",
        platform: device.platform,
      },
    ],
  });
}

function createSimulatorOverlay({
  w,
  h,
  deviceName,
  mockupPath,
  deviceScreenPct,
  orientation,
  platform,
}) {
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
  mockupContainer.style.scale = String(deviceScreenPct?.scale || 0.7);
  mockupContainer.style.overflow = "hidden";
  mockupContainer.style.transition = "transform 220ms ease";
  mockupContainer.style.transformOrigin = "50% 50%";
  mockupContainer.style.willChange = "transform";

  // Create mockup image with proper sizing
  const mockupImg = document.createElement("img");
  mockupImg.id = "__mf_simulator_mockup__";
  mockupImg.src = chrome.runtime.getURL(mockupPath);
  mockupImg.style.width = String(w) + "px";
  mockupImg.style.height = String(h) + "px";
  mockupImg.style.display = "block";
  mockupImg.style.position = "absolute";
  mockupImg.style.top = "0";
  mockupImg.style.left = "0";
  mockupImg.style.zIndex = "5";
  mockupImg.style.pointerEvents = "none";

  // Screen container that clips the iframe to the device screen area
  const pct = deviceScreenPct || {
    top: 10,
    right: 6,
    bottom: 10,
    left: 6,
    radius: 3,
    scale: 0.7,
  };
  const preset = {
    x: Math.round((pct.left / 100) * w),
    y: Math.round((pct.top / 100) * h),
    w: Math.max(0, Math.round(w - ((pct.left + pct.right) / 100) * w)),
    h: Math.max(0, Math.round(h - ((pct.top + pct.bottom) / 100) * h)),
    radius: Math.round((pct.radius / 100) * Math.min(w, h)),
  };

  const iframeContainer = document.createElement("div");
  iframeContainer.id = "__mf_simulator_screen__";
  iframeContainer.style.position = "absolute";
  iframeContainer.style.top = String(preset.y) + "px";
  iframeContainer.style.left = String(preset.x) + "px";
  iframeContainer.style.width = String(preset.w) + "px";
  iframeContainer.style.height = String(preset.h) + "px";
  iframeContainer.style.overflow = "hidden";
  iframeContainer.style.borderRadius = String(preset.radius) + "px";
  iframeContainer.style.zIndex = "1";

  // Create iframe positioned to fill the screen container
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.border = "none";
  iframe.style.background = "transparent";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.top = "0";
  iframe.style.left = "0";
  iframe.style.borderRadius = String(preset.radius) + "px";
  iframe.style.zIndex = "2";
  iframe.sandbox =
    "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups";
  iframe.src = window.location.href;

  // Add CSS to iframe to hide scrollbars after it loads
  iframe.onload = function () {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const style = iframeDoc.createElement("style");
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
      console.log("Cannot inject CSS into cross-origin iframe");
    }
  };

  iframeContainer.appendChild(iframe);
  mockupContainer.appendChild(mockupImg);
  mockupContainer.appendChild(iframeContainer);
  overlay.appendChild(mockupContainer);

  document.body.appendChild(overlay);
}

async function hideSimulator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const overlay = document.getElementById("__mf_simulator_overlay__");
        if (overlay) overlay.remove();
      },
    });

    await chrome.scripting.removeCSS({
      target: { tabId },
      css: `
        #__mf_simulator_overlay__ {
          position: fixed;
          inset: 0;
          background: #FFFF;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #__mf_simulator_frame__ {
          position: relative;
          display: inline-block;
          overflow: hidden;
          background: transparent;
        }
        
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
  } catch (error) {
    console.error("Failed to hide simulator:", error);
  }
}

async function applyScrollbar(tabId, show) {
  let css;
  if (show) {
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
        border: solid 3px transparent;
        background-clip: content-box;
        border-radius: 17px;
      }
    `;
  } else {
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
    await chrome.scripting.insertCSS({
      target: { tabId, allFrames: true },
      css,
    });
  } catch (error) {
    console.error("Failed to apply scrollbar CSS:", error);
  }
}

function getDefaultDevice() {
  return DEVICES[0];
}
