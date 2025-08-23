// Content script for device simulation
let currentDevice = null;
let isSimulatorActive = false;
let showScrollbar = false;
let devicePanel = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, device, showScrollbar: newShowScrollbar } = message;

  switch (type) {
    case "SIMULATOR_ACTIVATED":
      activateSimulator(device);
      break;

    case "SIMULATOR_DEACTIVATED":
      deactivateSimulator();
      break;

    case "DEVICE_CHANGED":
      changeDevice(device);
      break;

    case "TOGGLE_SCROLLBAR":
      toggleScrollbar(newShowScrollbar);
      break;
  }
});

function activateSimulator(device) {
  currentDevice = device;
  isSimulatorActive = true;

  // Apply viewport changes
  applyViewport(device);

  // Apply scrollbar settings
  toggleScrollbar(showScrollbar);

  // Create device panel
  createDevicePanel();

  console.log("Device simulator activated:", device.name);
}

function deactivateSimulator() {
  isSimulatorActive = false;
  currentDevice = null;

  // Restore original viewport
  restoreViewport();

  // Remove device panel
  removeDevicePanel();

  console.log("Device simulator deactivated");
}

function changeDevice(device) {
  currentDevice = device;

  // Update viewport
  applyViewport(device);

  // Update device panel
  updateDevicePanel();

  console.log("Device changed to:", device.name);
}

function applyViewport(device) {
  const { width, height } = device.viewport;

  // Set viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement("meta");
    viewportMeta.name = "viewport";
    document.head.appendChild(viewportMeta);
  }

  viewportMeta.content = `width=${width}, height=${height}, initial-scale=1, user-scalable=no`;

  // Apply CSS for viewport simulation
  const styleId = "device-simulator-style";
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    body {
      width: ${width}px !important;
      height: ${height}px !important;
      margin: 0 auto !important;
      overflow: hidden !important;
    }
    
    html {
      overflow: hidden !important;
    }
    
    /* Hide scrollbars by default */
    ::-webkit-scrollbar {
      display: none !important;
    }
    
    /* Show scrollbars when enabled */
    .show-scrollbar ::-webkit-scrollbar {
      display: block !important;
    }
    
    .show-scrollbar {
      overflow: auto !important;
    }
  `;
}

function restoreViewport() {
  // Remove viewport restrictions
  const style = document.getElementById("device-simulator-style");
  if (style) {
    style.remove();
  }

  // Reset viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.content = "width=device-width, initial-scale=1";
  }

  // Remove body classes
  document.body.classList.remove("show-scrollbar");
}

function toggleScrollbar(show) {
  showScrollbar = show;

  if (show) {
    document.body.classList.add("show-scrollbar");
  } else {
    document.body.classList.remove("show-scrollbar");
  }
}

function createDevicePanel() {
  if (devicePanel) {
    removeDevicePanel();
  }

  devicePanel = document.createElement("div");
  devicePanel.id = "device-simulator-panel";
  devicePanel.innerHTML = `
    <div class="device-info">
      <span class="device-name">${currentDevice.name}</span>
      <span class="device-resolution">${currentDevice.viewport.width}×${
    currentDevice.viewport.height
  }</span>
    </div>
    <div class="device-controls">
      <button id="change-device-btn" class="control-btn">Change Device</button>
      <button id="toggle-scrollbar-btn" class="control-btn">${
        showScrollbar ? "Hide" : "Show"
      } Scrollbar</button>
      <button id="deactivate-btn" class="control-btn">Deactivate</button>
    </div>
  `;

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    #device-simulator-panel {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 999999;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .device-info {
      margin-bottom: 8px;
    }
    
    .device-name {
      font-weight: bold;
      display: block;
    }
    
    .device-resolution {
      color: #ccc;
      font-size: 11px;
    }
    
    .device-controls {
      display: flex;
      gap: 5px;
    }
    
    .control-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .control-btn:hover {
      background: #0056b3;
    }
    
    #deactivate-btn {
      background: #dc3545;
    }
    
    #deactivate-btn:hover {
      background: #c82333;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(devicePanel);

  // Add event listeners
  document
    .getElementById("change-device-btn")
    .addEventListener("click", openDeviceSelector);
  document
    .getElementById("toggle-scrollbar-btn")
    .addEventListener("click", toggleScrollbarFromPanel);
  document
    .getElementById("deactivate-btn")
    .addEventListener("click", deactivateFromPanel);
}

function removeDevicePanel() {
  if (devicePanel) {
    devicePanel.remove();
    devicePanel = null;
  }

  // Remove styles
  const style = document.querySelector("style");
  if (style && style.textContent.includes("#device-simulator-panel")) {
    style.remove();
  }
}

function updateDevicePanel() {
  if (devicePanel && currentDevice) {
    const deviceName = devicePanel.querySelector(".device-name");
    const deviceResolution = devicePanel.querySelector(".device-resolution");

    if (deviceName) deviceName.textContent = currentDevice.name;
    if (deviceResolution)
      deviceResolution.textContent = `${currentDevice.viewport.width}×${currentDevice.viewport.height}`;
  }
}

function openDeviceSelector() {
  // Open device selection panel
  chrome.runtime.sendMessage({
    type: "OPEN_DEVICE_PANEL",
  });
}

function toggleScrollbarFromPanel() {
  chrome.runtime.sendMessage({
    type: "TOGGLE_SCROLLBAR_FOR_TAB",
    tabId: null, // Background script will get current tab
  });
}

function deactivateFromPanel() {
  chrome.runtime.sendMessage({
    type: "DEACTIVATE_SIMULATOR_FOR_TAB",
    tabId: null, // Background script will get current tab
  });
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

function initialize() {
  // Check if simulator is already active for this tab
  chrome.runtime.sendMessage(
    {
      type: "GET_TAB_STATE",
      tabId: null,
    },
    (response) => {
      if (response && response.isActive) {
        activateSimulator(response.device);
        if (response.showScrollbar) {
          toggleScrollbar(true);
        }
      }
    }
  );
}
