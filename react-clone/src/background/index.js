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

<<<<<<< HEAD
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

          // Wait for offscreen page to be ready
          await waitForOffscreenPage();

                     // Start recording using captureVisibleTab approach
           try {
             console.log("Starting recording with captureVisibleTab...");
             
             // Request activeTab permission first
             try {
               const hasPermission = await chrome.permissions.contains({ permissions: ['activeTab'] });
               if (!hasPermission) {
                 console.log("Requesting activeTab permission...");
                 const granted = await chrome.permissions.request({ permissions: ['activeTab'] });
                 if (!granted) {
                   sendResponse({ ok: false, error: "Permission denied - please click the record button again" });
                   return;
                 }
               }
             } catch (permError) {
               console.log("Permission request failed:", permError);
               sendResponse({ ok: false, error: "Permission request failed" });
               return;
             }
             
             // Send message to offscreen page to start frame-based recording
             chrome.runtime.sendMessage({
               type: "START_FRAME_RECORDING",
               mockupBounds: mockupBounds
             }, (response) => {
               if (chrome.runtime.lastError) {
                 console.error("Failed to start frame recording:", chrome.runtime.lastError);
                 sendResponse({ ok: false, error: "Failed to start recording" });
               } else if (response && response.ok) {
                 console.log("Frame-based recording started successfully");
                 sendResponse({ ok: true });
               } else {
                 console.error("Frame recording failed:", response?.error);
                 sendResponse({ ok: false, error: response?.error || "Failed to start recording" });
               }
             });
           } catch (error) {
             console.error("Error starting recording:", error);
             sendResponse({ ok: false, error: "Failed to start recording: " + error.message });
           }
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
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Failed to stop recording:", chrome.runtime.lastError);
              sendResponse({ ok: false, error: "Failed to stop recording" });
            } else {
              console.log("Recording stopped successfully");
              sendResponse({ ok: true });
            }
          });
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



    case "CAPTURE_FRAME":
      (async () => {
        try {
          console.log("CAPTURE_FRAME received");
          
          // Capture the current visible tab
          chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error("Frame capture error:", chrome.runtime.lastError);
              sendResponse({ ok: false, error: chrome.runtime.lastError.message });
              return;
            }
            
            if (dataUrl) {
              console.log("Frame captured successfully");
              sendResponse({ ok: true, dataUrl: dataUrl });
            } else {
              console.error("No frame data received");
              sendResponse({ ok: false, error: "No frame data received" });
            }
          });
          
        } catch (e) {
          console.error("CAPTURE_FRAME error", e);
          sendResponse({ ok: false, error: e.message });
        }
      })();
      return true;

    case "CREATE_VIDEO_FROM_FRAMES":
      (async () => {
        try {
          console.log("CREATE_VIDEO_FROM_FRAMES received");
          const { frames, width, height } = message;
          
          if (!frames || frames.length === 0) {
            sendResponse({ ok: false, error: "No frames provided" });
            return;
          }
          
          console.log(`Creating video from ${frames.length} frames, dimensions: ${width}x${height}`);
          
          // Create offscreen page for video creation
          await createOffscreenPage();
          
          // Send frames to offscreen page for video creation
          chrome.runtime.sendMessage({
            type: "CREATE_VIDEO_FROM_FRAMES",
            frames: frames,
            width: width,
            height: height
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Failed to send frames to offscreen page:", chrome.runtime.lastError);
              sendResponse({ ok: false, error: "Failed to create video" });
            } else if (response && response.ok && response.videoBlob) {
              console.log("Video created successfully in offscreen page");
              sendResponse({ ok: true, videoBlob: response.videoBlob });
            } else {
              console.error("Video creation failed in offscreen page:", response);
              sendResponse({ ok: false, error: "Video creation failed" });
            }
          });
          
        } catch (e) {
          console.error("CREATE_VIDEO_FROM_FRAMES error", e);
          sendResponse({ ok: false, error: e.message });
        }
      })();
      return true;

=======
>>>>>>> d8a4ecfb5c42046b31dab75c9149919828e55e7f
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
    tabState.orientation =
      tabState.orientation === "portrait" ? "landscape" : "portrait";
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
      console.log(
        "Content script not ready for orientation change message:",
        tabId
      );
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
    const adjustedScreenPct = isLandscape
      ? rotateScreenPctCW(device.screenPct)
      : device.screenPct;

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

  // Create browser navigation bar based on device platform
  const createBrowserNavBar = () => {
    const navBar = document.createElement("div");
    navBar.id = "__mf_browser_nav_bar__";
    navBar.style.position = "absolute";
    navBar.style.top = "0";
    navBar.style.left = "0";
    navBar.style.right = "0";
    navBar.style.zIndex = "10"; // Above iframe, below mockup
    navBar.style.pointerEvents = "none"; // Let clicks pass through to iframe

    if (platform === "iOS") {
      // iOS Safari Navigation Bar
      navBar.style.height = "44px";
      navBar.style.background =
        "linear-gradient(180deg, #f2f2f7 0%, #e5e5ea 100%)";
      navBar.style.borderBottom = "0.5px solid #c6c6c8";
      navBar.style.display = "flex";
      navBar.style.alignItems = "center";
      navBar.style.justifyContent = "space-between";
      navBar.style.padding = "0 8px";
      navBar.style.fontFamily =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      navBar.style.fontSize = "17px";
      navBar.style.fontWeight = "600";
      navBar.style.color = "#000";

      // Left side - Back button and page title
      const leftSection = document.createElement("div");
      leftSection.style.display = "flex";
      leftSection.style.alignItems = "center";
      leftSection.style.gap = "8px";
      leftSection.style.flex = "1";

      const backBtn = document.createElement("div");
      backBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      backBtn.style.color = "#007AFF";
      backBtn.style.cursor = "pointer";
      backBtn.style.pointerEvents = "auto";
      backBtn.style.padding = "4px";
      backBtn.style.borderRadius = "4px";
      backBtn.style.transition = "background-color 0.2s";
      backBtn.onmouseenter = () =>
        (backBtn.style.backgroundColor = "rgba(0, 122, 255, 0.1)");
      backBtn.onmouseleave = () =>
        (backBtn.style.backgroundColor = "transparent");

      const pageTitle = document.createElement("div");
      pageTitle.textContent = "Safari";
      pageTitle.style.fontWeight = "500";
      pageTitle.style.color = "#000";
      pageTitle.style.overflow = "hidden";
      pageTitle.style.textOverflow = "ellipsis";
      pageTitle.style.whiteSpace = "nowrap";

      leftSection.appendChild(backBtn);
      leftSection.appendChild(pageTitle);

      // Center - URL bar
      const centerSection = document.createElement("div");
      centerSection.style.flex = "2";
      centerSection.style.display = "flex";
      centerSection.style.alignItems = "center";
      centerSection.style.justifyContent = "center";

      const urlBar = document.createElement("div");
      urlBar.style.background = "rgba(142, 142, 147, 0.12)";
      urlBar.style.borderRadius = "10px";
      urlBar.style.padding = "6px 12px";
      urlBar.style.fontSize = "15px";
      urlBar.style.color = "#000";
      urlBar.style.fontWeight = "400";
      urlBar.style.maxWidth = "200px";
      urlBar.style.overflow = "hidden";
      urlBar.style.textOverflow = "ellipsis";
      urlBar.style.whiteSpace = "nowrap";
      urlBar.style.border = "1px solid rgba(142, 142, 147, 0.2)";
      urlBar.textContent = window.location.hostname || "example.com";

      centerSection.appendChild(urlBar);

      // Right side - Share and tabs buttons
      const rightSection = document.createElement("div");
      rightSection.style.display = "flex";
      rightSection.style.alignItems = "center";
      rightSection.style.gap = "8px";
      rightSection.style.flex = "1";
      rightSection.style.justifyContent = "flex-end";

      const shareBtn = document.createElement("div");
      shareBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 6L12 2L8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 2V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      shareBtn.style.color = "#007AFF";
      shareBtn.style.cursor = "pointer";
      shareBtn.style.pointerEvents = "auto";
      shareBtn.style.padding = "4px";
      shareBtn.style.borderRadius = "4px";
      shareBtn.style.transition = "background-color 0.2s";
      shareBtn.onmouseenter = () =>
        (shareBtn.style.backgroundColor = "rgba(0, 122, 255, 0.1)");
      shareBtn.onmouseleave = () =>
        (shareBtn.style.backgroundColor = "transparent");

      const tabsBtn = document.createElement("div");
      tabsBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="9" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="10" y="3" width="7" height="9" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="17" y="3" width="4" height="9" rx="1" stroke="currentColor" stroke-width="2"/>
        </svg>
      `;
      tabsBtn.style.color = "#007AFF";
      tabsBtn.style.cursor = "pointer";
      tabsBtn.style.pointerEvents = "auto";
      tabsBtn.style.padding = "4px";
      tabsBtn.style.borderRadius = "4px";
      tabsBtn.style.transition = "background-color 0.2s";
      tabsBtn.onmouseenter = () =>
        (tabsBtn.style.backgroundColor = "rgba(0, 122, 255, 0.1)");
      tabsBtn.onmouseleave = () =>
        (tabsBtn.style.backgroundColor = "transparent");

      rightSection.appendChild(shareBtn);
      rightSection.appendChild(tabsBtn);

      navBar.appendChild(leftSection);
      navBar.appendChild(centerSection);
      navBar.appendChild(rightSection);
    } else if (platform === "Android") {
      // Android Chrome Navigation Bar
      navBar.style.height = "56px";
      navBar.style.background = "#ffffff";
      navBar.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
      navBar.style.display = "flex";
      navBar.style.alignItems = "center";
      navBar.style.justifyContent = "space-between";
      navBar.style.padding = "0 8px";
      navBar.style.fontFamily = "'Roboto', 'Noto Sans', sans-serif";
      navBar.style.fontSize = "16px";
      navBar.style.color = "#000";

      // Left side - Back button
      const leftSection = document.createElement("div");
      leftSection.style.display = "flex";
      leftSection.style.alignItems = "center";
      leftSection.style.gap = "8px";

      const backBtn = document.createElement("div");
      backBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
        </svg>
      `;
      backBtn.style.color = "#5f6368";
      backBtn.style.cursor = "pointer";
      backBtn.style.pointerEvents = "auto";
      backBtn.style.padding = "8px";
      backBtn.style.borderRadius = "50%";
      backBtn.style.transition = "background-color 0.2s";
      backBtn.onmouseenter = () =>
        (backBtn.style.backgroundColor = "rgba(95, 99, 104, 0.1)");
      backBtn.onmouseleave = () =>
        (backBtn.style.backgroundColor = "transparent");

      leftSection.appendChild(backBtn);

      // Center - URL bar
      const centerSection = document.createElement("div");
      centerSection.style.flex = "1";
      centerSection.style.display = "flex";
      centerSection.style.alignItems = "center";
      centerSection.style.justifyContent = "center";
      centerSection.style.margin = "0 16px";

      const urlBar = document.createElement("div");
      urlBar.style.background = "#f1f3f4";
      urlBar.style.borderRadius = "24px";
      urlBar.style.padding = "8px 16px";
      urlBar.style.fontSize = "14px";
      urlBar.style.color = "#5f6368";
      urlBar.style.fontWeight = "400";
      urlBar.style.maxWidth = "280px";
      urlBar.style.overflow = "hidden";
      urlBar.style.textOverflow = "ellipsis";
      urlBar.style.whiteSpace = "nowrap";
      urlBar.style.display = "flex";
      urlBar.style.alignItems = "center";
      urlBar.style.gap = "8px";

      const lockIcon = document.createElement("div");
      lockIcon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="#34a853"/>
        </svg>
      `;

      const urlText = document.createElement("span");
      urlText.textContent = window.location.hostname || "example.com";

      urlBar.appendChild(lockIcon);
      urlBar.appendChild(urlText);

      centerSection.appendChild(urlBar);

      // Right side - More options and tabs
      const rightSection = document.createElement("div");
      rightSection.style.display = "flex";
      rightSection.style.alignItems = "center";
      rightSection.style.gap = "8px";

      const moreBtn = document.createElement("div");
      moreBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor"/>
        </svg>
      `;
      moreBtn.style.color = "#5f6368";
      moreBtn.style.cursor = "pointer";
      moreBtn.style.pointerEvents = "auto";
      moreBtn.style.padding = "8px";
      moreBtn.style.borderRadius = "50%";
      moreBtn.style.transition = "background-color 0.2s";
      moreBtn.onmouseenter = () =>
        (moreBtn.style.backgroundColor = "rgba(95, 99, 104, 0.1)");
      moreBtn.onmouseleave = () =>
        (moreBtn.style.backgroundColor = "transparent");

      const tabsBtn = document.createElement("div");
      tabsBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
          <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="currentColor"/>
        </svg>
      `;
      tabsBtn.style.color = "#5f6368";
      tabsBtn.style.cursor = "pointer";
      tabsBtn.style.pointerEvents = "auto";
      tabsBtn.style.padding = "8px";
      tabsBtn.style.borderRadius = "50%";
      tabsBtn.style.transition = "background-color 0.2s";
      tabsBtn.onmouseenter = () =>
        (tabsBtn.style.backgroundColor = "rgba(95, 99, 104, 0.1)");
      tabsBtn.onmouseleave = () =>
        (tabsBtn.style.backgroundColor = "transparent");

      rightSection.appendChild(moreBtn);
      rightSection.appendChild(tabsBtn);

      navBar.appendChild(leftSection);
      navBar.appendChild(centerSection);
      navBar.appendChild(rightSection);
    }

    return navBar;
  };

  // Add browser navigation bar to iframe container
  const browserNavBar = createBrowserNavBar();
  iframeContainer.appendChild(browserNavBar);

  // Adjust iframe to account for navigation bar height
  const navBarHeight = platform === "iOS" ? 44 : 56;
  iframe.style.top = navBarHeight + "px";
  iframe.style.height = `calc(100% - ${navBarHeight}px)`;

  // Handle landscape orientation for browser nav bar
  if (orientation === "landscape") {
    // In landscape, we might want to hide the nav bar or make it more compact
    browserNavBar.style.display = "none"; // Hide nav bar in landscape for better space usage
    iframe.style.top = "0px";
    iframe.style.height = "100%";
  }

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
        const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
        if (overlay) overlay.remove();
        if (browserNavBar) browserNavBar.remove();
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
<<<<<<< HEAD

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
    const maxAttempts = 100; // 10 seconds max wait
    
    function checkReady() {
      attempts++;
      try {
        chrome.runtime.sendMessage({ type: "PING" }, (response) => {
          if (chrome.runtime.lastError) {
            if (attempts < maxAttempts) {
              setTimeout(checkReady, 100);
            } else {
              console.log("Offscreen page not ready after max attempts, proceeding anyway");
              resolve();
            }
          } else {
            console.log("Offscreen page is ready");
            resolve();
          }
        });
      } catch (error) {
        if (attempts < maxAttempts) {
          setTimeout(checkReady, 100);
        } else {
          console.log("Offscreen page check failed after max attempts, proceeding anyway");
          resolve();
        }
      }
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
=======
>>>>>>> d8a4ecfb5c42046b31dab75c9149919828e55e7f
