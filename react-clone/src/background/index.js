import { DEVICES, getDeviceBySlug } from "../shared/devices.js";

// Store tab states with orientation information
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
      // If tabId is null, get the current active tab
      if (tabId === null) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            deactivateSimulatorForTab(tabs[0].id);
          }
        });
      } else {
        deactivateSimulatorForTab(tabId);
      }
      break;

    case "SET_DEVICE_FOR_TAB":
      // If tabId is null, get the current active tab
      if (tabId === null) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            setDeviceForTab(tabs[0].id, deviceSlug);
          }
        });
      } else {
        setDeviceForTab(tabId, deviceSlug);
      }
      break;

    case "TOGGLE_ORIENTATION_FOR_TAB":
      // If tabId is null, get the current active tab
      if (tabId === null) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            toggleOrientationForTab(tabs[0].id);
          }
        });
      } else {
        toggleOrientationForTab(tabs[0].id);
      }
      break;

    case "GET_TAB_STATE":
      sendResponse(getTabState(tabId));
      break;

    case "TOGGLE_SCROLLBAR_FOR_TAB":
      toggleScrollbarForTab(tabId, sendResponse);
      break;

    // Background/service worker: capture visible tab and return dataUrl
    case "CAPTURE_TAB":
      (async () => {
        try {
          // captureVisibleTab uses the currently focused window; null is fine
          chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error("captureVisibleTab err", chrome.runtime.lastError);
              sendResponse({
                ok: false,
                error: chrome.runtime.lastError.message,
              });
              return;
            }
            sendResponse({ ok: true, dataUrl });
          });
        } catch (e) {
          console.error("CAPTURE_TAB error", e);
          sendResponse({ ok: false, error: e.message });
        }
      })();
      return true; // keep message channel open for async sendResponse

    // Handle recording functionality
    case "START_RECORDING":
      (async () => {
        try {
          const tabId = sender.tab?.id;
          if (!tabId) {
            sendResponse({ ok: false, error: "No tab ID found" });
            return;
          }

          // Get the mockup bounds from the content script
          const mockupBounds = await getMockupBounds(tabId);
          if (!mockupBounds) {
            sendResponse({ ok: false, error: "Mockup not found" });
            return;
          }

          // Create offscreen page for recording if it doesn't exist
          await createOffscreenPage();

          // Create offscreen page for recording if it doesn't exist
          await createOffscreenPage();

          // Wait for offscreen page to be ready
          await waitForOffscreenPage();

          // Start recording in the offscreen page with the mockup bounds
          chrome.runtime.sendMessage({
            type: "START_RECORDING",
            mockupBounds: mockupBounds
          });

          sendResponse({ ok: true });
        } catch (e) {
          console.error("START_RECORDING error", e);
          sendResponse({ ok: false, error: e.message });
        }
      })();
      return true;

    case "STOP_RECORDING":
      (async () => {
        try {
          // Stop recording in the offscreen page
          chrome.runtime.sendMessage({
            type: "STOP_RECORDING"
          });
          sendResponse({ ok: true });
        } catch (e) {
          console.error("STOP_RECORDING error", e);
          sendResponse({ ok: false, error: e.message });
        }
      })();
      return true;

    case "GET_RECORDING_STATUS":
      (async () => {
        try {
          // Get recording status from offscreen page
          chrome.runtime.sendMessage({
            type: "GET_RECORDING_STATUS"
          }, (response) => {
            sendResponse(response);
          });
        } catch (e) {
          console.error("GET_RECORDING_STATUS error", e);
          sendResponse({ ok: false, error: e.message });
        }
      })();
      return true;

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

// Toggle simulator when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  const tabState = getTabState(tab.id);
  if (tabState && tabState.isActive) {
    deactivateSimulatorForTab(tab.id);
  } else {
    activateSimulatorForTab(tab.id);
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
  const tabState = getTabState(tabId);
  
  tabState.isActive = true;
  tabState.device = device;
  tabState.orientation = "portrait"; // Reset to portrait when activating
  tabState.showScrollbar = false;
  tabState.originalUA = null;

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
    tabState.orientation = "portrait"; // Reset orientation when changing device
    tabStates.set(tabId, tabState);
    
    applyDeviceToTab(tabId, device);
    showSimulator(tabId, tabState);
    
    console.log("Device changed to:", device.name);
  }
}

function toggleOrientationForTab(tabId) {
  const tabState = getTabState(tabId);
  if (tabState && tabState.isActive) {
    // Toggle between portrait and landscape
    tabState.orientation = tabState.orientation === "portrait" ? "landscape" : "portrait";
    tabStates.set(tabId, tabState);
    
    // Recreate simulator with new orientation
    showSimulator(tabId, tabState);
    
    // Notify content script about orientation change
    try {
      chrome.tabs.sendMessage(tabId, {
        type: "ORIENTATION_CHANGED",
        orientation: tabState.orientation,
      });
    } catch (error) {
      console.log("Content script not ready for orientation change message:", tabId);
    }
    
    console.log("Orientation changed to:", tabState.orientation);
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
  if (!tabStates.has(tabId)) {
    tabStates.set(tabId, {
      isActive: false,
      device: null,
      orientation: "portrait", // Add orientation state
      showScrollbar: false,
      originalUA: null,
    });
  }
  return tabStates.get(tabId);
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
    const device = state.device;
    const orientation = state.orientation || "portrait";
    
    // Calculate dimensions based on orientation
    const isLandscape = orientation === "landscape";
    const w = isLandscape ? device.viewport.height : device.viewport.width;
    const h = isLandscape ? device.viewport.width : device.viewport.height;
    
    // Adjust screen percentages for landscape orientation
    const adjustedScreenPct = isLandscape ? rotateScreenPctCW(device.screenPct) : device.screenPct;

    // Inject the simulator CSS
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

    await chrome.scripting.executeScript({
      target: { tabId },
      func: createSimulatorOverlay,
      args: [
        {
          w,
          h,
          deviceName: device.name,
          mockupPath: device.mockup,
          deviceScreenPct: adjustedScreenPct,
          orientation,
          platform: device.platform,
        },
      ],
    });

    // Notify content script that simulator is activated
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "SIMULATOR_ACTIVATED",
        device: device,
        orientation: orientation,
      });
    } catch (error) {
      console.log("Content script not ready yet for tab:", tabId);
    }
  } catch (error) {
    console.error("Failed to show simulator:", error);
  }
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
  
  // Store orientation data for future reference
  mockupContainer.setAttribute("data-orientation", orientation);

  // Create mockup image with proper sizing
  const mockupImg = document.createElement("img");
  mockupImg.id = "__mf_simulator_mockup__";
  mockupImg.src = chrome.runtime.getURL(mockupPath);
  mockupImg.style.width = String(w) + "px";
  mockupImg.style.height = String(h) + "px";
  mockupImg.style.display = "block";
  mockupImg.style.position = "absolute";
  
  // Apply rotation for landscape orientation (like in basic_clone)
  if (orientation === "landscape") {
    mockupImg.style.width = String(h) + "px";
    mockupImg.style.height = String(w) + "px";
    mockupImg.style.top = "50%";
    mockupImg.style.left = "50%";
    mockupImg.style.transform = "translate(-50%, -50%) rotate(90deg)";
    mockupImg.style.transformOrigin = "center center";
  } else {
    mockupImg.style.top = "0";
    mockupImg.style.left = "0";
  }
  
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
    // Notify content script that simulator is deactivated
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "SIMULATOR_DEACTIVATED",
      });
    } catch (error) {
      console.log("Content script not ready for tab:", tabId);
    }

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

// Rotate screen percentage insets 90° clockwise to match landscape orientation
function rotateScreenPctCW(pct) {
  if (!pct) return pct;
  const { top = 0, right = 0, bottom = 0, left = 0, radius = 0, scale } = pct;
  return {
    top: left,
    right: top,
    bottom: right,
    left: bottom,
    radius,
    scale,
  };
}

function getDefaultDevice() {
  return DEVICES[0];
}

// Helper function to get mockup bounds from content script
async function getMockupBounds(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "GET_MOCKUP_BOUNDS"
    });
    return response;
  } catch (error) {
    console.error("Failed to get mockup bounds:", error);
    return null;
  }
}

// Helper function to create offscreen page for recording
async function createOffscreenPage() {
  try {
    // Create new offscreen page
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen/recording.html'),
      reasons: ['DISPLAY_MEDIA'],
      justification: 'Recording mockup screen'
    });
  } catch (error) {
    // If page already exists, that's fine
    if (error.message.includes('already exists') || error.message.includes('Only a single offscreen document may be created')) {
      return;
    }
    console.error("Failed to create offscreen page:", error);
    throw error;
  }
}

// Helper function to wait for offscreen page to be ready
async function waitForOffscreenPage() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    function checkReady() {
      attempts++;
      chrome.runtime.sendMessage({ type: "PING" }, (response) => {
        if (chrome.runtime.lastError) {
          if (attempts < maxAttempts) {
            setTimeout(checkReady, 100);
          } else {
            console.log("Offscreen page not ready after max attempts, proceeding anyway");
            resolve();
          }
        } else {
          resolve();
        }
      });
    }
    
    checkReady();
  });
}

// Listen for messages from offscreen page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id === chrome.runtime.id && sender.origin === chrome.runtime.getURL('')) {
    // Message from offscreen page
    const { type } = message;
    
    switch (type) {
      case "RECORDING_STARTED":
        console.log("Recording started");
        break;
      case "RECORDING_COMPLETED":
        console.log("Recording completed");
        break;
    }
  }
});
