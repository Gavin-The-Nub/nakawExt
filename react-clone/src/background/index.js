import {
  DEVICES,
  getDeviceBySlug,
  getDefaultDevice,
} from "../shared/devices.js";

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

  // Notify content script
  chrome.tabs
    .sendMessage(tabId, {
      type: "SIMULATOR_ACTIVATED",
      device: device,
    })
    .catch(() => {
      // Content script might not be ready yet
      console.log("Content script not ready for tab:", tabId);
    });
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

    // Remove device simulation
    chrome.tabs
      .sendMessage(tabId, {
        type: "SIMULATOR_DEACTIVATED",
      })
      .catch(() => {
        console.log("Content script not ready for tab:", tabId);
      });

    tabStates.delete(tabId);
  }
}

function setDeviceForTab(tabId, deviceSlug) {
  const device = getDeviceBySlug(deviceSlug);
  const tabState = getTabState(tabId);

  if (tabState && tabState.isActive) {
    tabState.device = device;
    applyDeviceToTab(tabId, device);

    // Notify content script
    chrome.tabs
      .sendMessage(tabId, {
        type: "DEVICE_CHANGED",
        device: device,
      })
      .catch(() => {
        console.log("Content script not ready for tab:", tabId);
      });
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

    chrome.tabs
      .sendMessage(tabId, {
        type: "TOGGLE_SCROLLBAR",
        showScrollbar: tabState.showScrollbar,
      })
      .catch(() => {
        console.log("Content script not ready for tab:", tabId);
      });

    sendResponse(tabState);
  }
}

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    tabStates,
    activateSimulatorForTab,
    deactivateSimulatorForTab,
    setDeviceForTab,
    getTabState,
  };
}
