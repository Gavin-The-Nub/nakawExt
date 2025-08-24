// Content script for device simulation
// This script injects a floating toolbar when the simulator is active

let toolbar = null;
let deviceSelector = null;
let devicePanel = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, device, showScrollbar } = message;

  switch (type) {
    case "SIMULATOR_ACTIVATED":
      injectToolbar();
      break;

    case "SIMULATOR_DEACTIVATED":
      removeToolbar();
      break;

    case "DEVICE_CHANGED":
      console.log("Device changed to:", device.name);
      // Ensure toolbar remains visible after device change
      setTimeout(() => {
        const existingToolbar = document.getElementById("mf-toolbar");
        if (!existingToolbar) {
          console.log(
            "Toolbar disappeared after device change, re-injecting..."
          );
          toolbar = null; // Reset toolbar reference
          injectToolbar();
        }
      }, 100); // Small delay to ensure overlay recreation is complete
      break;

    case "TOGGLE_SCROLLBAR":
      // Update toolbar state if needed
      break;
  }
});

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

function initialize() {
  console.log("Device simulator content script loaded");
}

function injectToolbar() {
  // Remove any existing toolbar first
  removeToolbar();

  toolbar = document.createElement("div");
  toolbar.id = "mf-toolbar";
  toolbar.innerHTML = `
    <style>
      #mf-toolbar {
        position: fixed;
        top: 60px;
        right: 24px;
        z-index: 2147483648 !important;
        display: flex !important;
        flex-direction: column;
        gap: 24px;
        pointer-events: none;
      }
      .mf-toolbar-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #555;
        box-shadow: 0 2px 12px rgba(0,0,0,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        cursor: pointer;
        border: none;
        outline: none;
        transition: background 0.2s;
        pointer-events: auto;
      }
      .mf-toolbar-btn:active {
        background: #333;
      }
      .mf-toolbar-btn.selected {
        background: #2196f3;
      }
      .mf-toolbar-btn svg {
        width: 28px;
        height: 28px;
        stroke: #fff;
        fill: none;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      
      #mf-device-selector {
        position: fixed;
        top: 60px;
        right: 100px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 16px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 2147483648;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        min-width: 250px;
        display: none;
      }
      .device-category {
        margin-bottom: 16px;
      }
      .device-category h4 {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255, 255, 255, 0.7);
      }
      .device-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 8px;
      }
      .device-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .device-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .device-btn.selected {
        background: #007AFF;
      }
    </style>
    <button class="mf-toolbar-btn" id="mf-btn-close" title="Close Simulator">
      <svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-device" title="Device Mode">
      <svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1.5"/></svg>
    </button>
    <button class="mf-toolbar-btn selected" id="mf-btn-panel" title="Show Device Panel">
      <svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/></svg>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-rotate" title="Rotate">
      <svg viewBox="0 0 24 24"><path d="M2 12A10 10 0 1 1 12 22"/><polyline points="2 12 2 6 8 6"/></svg>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-screenshot" title="Screenshot">
      <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-record" title="Record">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>
    </button>
  `;

  // Ensure we append to body and it's properly attached
  if (document.body) {
    document.body.appendChild(toolbar);
  } else {
    // If body is not ready, wait for it
    document.addEventListener("DOMContentLoaded", () => {
      if (document.body && !document.getElementById("mf-toolbar")) {
        document.body.appendChild(toolbar);
      }
    });
  }

  // Create device selector
  createDeviceSelector();

  // Button event handlers
  document.getElementById("mf-btn-close").onclick = () => {
    chrome.runtime.sendMessage({
      type: "DEACTIVATE_SIMULATOR_FOR_TAB",
      tabId: null,
    });
  };

  document.getElementById("mf-btn-device").onclick = () => {
    toggleDeviceSelector();
  };

  document.getElementById("mf-btn-panel").onclick = () => {
    toggleDevicePanel();
  };

  document.getElementById("mf-btn-rotate").onclick = () => {
    // Rotate action (placeholder)
    alert("Rotate functionality coming soon!");
  };

  document.getElementById("mf-btn-screenshot").onclick = () => {
    // Screenshot action (placeholder)
    alert("Screenshot functionality coming soon!");
  };

  document.getElementById("mf-btn-record").onclick = () => {
    // Record action (placeholder)
    alert("Record functionality coming soon!");
  };
}

function createDeviceSelector() {
  deviceSelector = document.createElement("div");
  deviceSelector.id = "mf-device-selector";

  const devices = [
    { slug: "ip16", name: "iPhone 16", platform: "iOS" },
    { slug: "ip15", name: "iPhone 15", platform: "iOS" },
    { slug: "ip14", name: "iPhone 14", platform: "iOS" },
    { slug: "ip13", name: "iPhone 13", platform: "iOS" },
    { slug: "ip12", name: "iPhone 12", platform: "iOS" },
    { slug: "ip11", name: "iPhone 11", platform: "iOS" },
    { slug: "ipx", name: "iPhone X", platform: "iOS" },
    { slug: "ipxr", name: "iPhone XR", platform: "iOS" },
    { slug: "ipad-pro", name: "iPad Pro", platform: "iOS" },
    { slug: "ipad-air", name: "iPad Air", platform: "iOS" },
    { slug: "ipad-mini", name: "iPad Mini", platform: "iOS" },
    { slug: "applewatch", name: "Apple Watch", platform: "iOS" },
    { slug: "gpixel8", name: "Google Pixel 8", platform: "Android" },
    { slug: "gpixel6", name: "Google Pixel 6", platform: "Android" },
    { slug: "gpixel5", name: "Google Pixel 5", platform: "Android" },
    { slug: "sgalaxys24", name: "Samsung Galaxy S24", platform: "Android" },
    { slug: "sgalaxys22", name: "Samsung Galaxy S22", platform: "Android" },
    { slug: "sgalaxys20", name: "Samsung Galaxy S20", platform: "Android" },
    { slug: "sgalaxyfold", name: "Samsung Galaxy Fold", platform: "Android" },
    {
      slug: "sgalaxyzflip",
      name: "Samsung Galaxy Z Flip",
      platform: "Android",
    },
    { slug: "hp30", name: "Huawei P30 Pro", platform: "Android" },
    { slug: "mb-air", name: "MacBook Air", platform: "macOS" },
    { slug: "apple-imac", name: "Apple iMac", platform: "macOS" },
    { slug: "dell14", name: "Dell Latitude", platform: "macOS" },
  ];

  const categories = {
    iOS: devices.filter((d) => d.platform === "iOS"),
    Android: devices.filter((d) => d.platform === "Android"),
    macOS: devices.filter((d) => d.platform === "macOS"),
  };

  let html =
    '<h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Select Device</h3>';

  Object.entries(categories).forEach(([platform, platformDevices]) => {
    if (platformDevices.length === 0) return;

    html += `
      <div class="device-category">
        <h4>${platform}</h4>
        <div class="device-grid">
    `;

    platformDevices.forEach((device) => {
      html += `
        <button class="device-btn" data-device="${device.slug}">
          ${device.name}
        </button>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  deviceSelector.innerHTML = html;
  document.body.appendChild(deviceSelector);

  // Add click handlers for device buttons
  deviceSelector.querySelectorAll(".device-btn").forEach((btn) => {
    btn.onclick = () => {
      const deviceSlug = btn.getAttribute("data-device");
      chrome.runtime.sendMessage({
        type: "SET_DEVICE_FOR_TAB",
        tabId: null,
        deviceSlug: deviceSlug,
      });
      hideDeviceSelector();
    };
  });
}

function toggleDeviceSelector() {
  if (deviceSelector.style.display === "block") {
    hideDeviceSelector();
  } else {
    showDeviceSelector();
  }
}

function showDeviceSelector() {
  if (deviceSelector) {
    deviceSelector.style.display = "block";
  }
}

function hideDeviceSelector() {
  if (deviceSelector) {
    deviceSelector.style.display = "none";
  }
}

function toggleDevicePanel() {
  // Toggle the existing device panel visibility
  const existingPanel = document.getElementById("__mf_device_panel__");
  if (existingPanel) {
    if (existingPanel.style.display === "none") {
      existingPanel.style.display = "block";
      document.getElementById("mf-btn-panel").classList.add("selected");
    } else {
      existingPanel.style.display = "none";
      document.getElementById("mf-btn-panel").classList.remove("selected");
    }
  }
}

function removeToolbar() {
  if (toolbar) {
    toolbar.remove();
    toolbar = null;
  }
  if (deviceSelector) {
    deviceSelector.remove();
    deviceSelector = null;
  }
}
