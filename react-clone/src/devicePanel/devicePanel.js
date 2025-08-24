// Device Panel Content Script
// This script creates a floating device selection panel

const DEVICES = [
  { slug: "ip16", name: "iPhone 16", platform: "iOS" },
  { slug: "ip15", name: "iPhone 15", platform: "iOS" },
  { slug: "ip14", name: "iPhone 14", platform: "iOS" },
  { slug: "ip13", name: "iPhone 13", platform: "iOS" },
  { slug: "ip12", name: "iPhone 12", platform: "iOS" },
  { slug: "ip11", name: "iPhone 11", platform: "iOS" },
  { slug: "gpixel8", name: "Google Pixel 8", platform: "Android" },
  { slug: "gpixel6", name: "Google Pixel 6", platform: "Android" },
  { slug: "gpixel5", name: "Google Pixel 5", platform: "Android" },
  { slug: "mb-air", name: "MacBook Air", platform: "macOS" },
  { slug: "apple-imac", name: "Apple iMac", platform: "macOS" },
  { slug: "dell14", name: "Dell Latitude", platform: "macOS" },
  { slug: "applewatch", name: "Apple Watch", platform: "iOS" },
  { slug: "hp30", name: "Huawei P30 Pro", platform: "Android" },
];

let devicePanel = null;
let currentDevice = "ip16";

function createDevicePanel() {
  if (devicePanel) {
    devicePanel.remove();
  }

  devicePanel = document.createElement("div");
  devicePanel.id = "__mf_device_panel__";
  devicePanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 16px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 92147483650;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 300px;
    min-width: 250px;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  `;

  const title = document.createElement("h3");
  title.textContent = "Device Simulator";
  title.style.cssText = `
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  `;
  closeBtn.onmouseenter = () =>
    (closeBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)");
  closeBtn.onmouseleave = () =>
    (closeBtn.style.backgroundColor = "transparent");
  closeBtn.onclick = () => devicePanel.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Device categories
  const categories = {
    iOS: DEVICES.filter((d) => d.platform === "iOS"),
    Android: DEVICES.filter((d) => d.platform === "Android"),
    macOS: DEVICES.filter((d) => d.platform === "macOS"),
  };

  Object.entries(categories).forEach(([platform, devices]) => {
    if (devices.length === 0) return;

    const categoryDiv = document.createElement("div");
    categoryDiv.style.marginBottom = "16px";

    const categoryTitle = document.createElement("h4");
    categoryTitle.textContent = platform;
    categoryTitle.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255, 255, 255, 0.7);
    `;

    const deviceGrid = document.createElement("div");
    deviceGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 8px;
    `;

    devices.forEach((device) => {
      const deviceBtn = document.createElement("button");
      deviceBtn.textContent = device.name;
      deviceBtn.style.cssText = `
        background: ${
          device.slug === currentDevice ? "#007AFF" : "rgba(255, 255, 255, 0.1)"
        };
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
      `;
      deviceBtn.onmouseenter = () => {
        if (device.slug !== currentDevice) {
          deviceBtn.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        }
      };
      deviceBtn.onmouseleave = () => {
        if (device.slug !== currentDevice) {
          deviceBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }
      };
      deviceBtn.onclick = () => {
        currentDevice = device.slug;
        chrome.runtime.sendMessage({
          type: "SET_DEVICE_FOR_TAB",
          tabId: null, // Background script will get current tab
          deviceSlug: device.slug,
        });
        updateDeviceButtons();
      };

      deviceGrid.appendChild(deviceBtn);
    });

    categoryDiv.appendChild(categoryTitle);
    categoryDiv.appendChild(deviceGrid);
    devicePanel.appendChild(categoryDiv);
  });

  // Controls section
  const controlsDiv = document.createElement("div");
  controlsDiv.style.cssText = `
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  `;

  const scrollbarBtn = document.createElement("button");
  scrollbarBtn.textContent = "Toggle Scrollbar";
  scrollbarBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
    margin-bottom: 8px;
  `;
  scrollbarBtn.onmouseenter = () =>
    (scrollbarBtn.style.backgroundColor = "rgba(255, 255, 255, 0.2)");
  scrollbarBtn.onmouseleave = () =>
    (scrollbarBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)");
  scrollbarBtn.onclick = () => {
    chrome.runtime.sendMessage({
      type: "TOGGLE_SCROLLBAR_FOR_TAB",
      tabId: null,
    });
  };

  const deactivateBtn = document.createElement("button");
  deactivateBtn.textContent = "Deactivate Simulator";
  deactivateBtn.style.cssText = `
    background: #FF3B30;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
  `;
  deactivateBtn.onmouseenter = () =>
    (deactivateBtn.style.backgroundColor = "#D70015");
  deactivateBtn.onmouseleave = () =>
    (deactivateBtn.style.backgroundColor = "#FF3B30");
  deactivateBtn.onclick = () => {
    chrome.runtime.sendMessage({
      type: "DEACTIVATE_SIMULATOR_FOR_TAB",
      tabId: null,
    });
    devicePanel.remove();
  };

  controlsDiv.appendChild(scrollbarBtn);
  controlsDiv.appendChild(deactivateBtn);

  devicePanel.appendChild(header);
  devicePanel.appendChild(controlsDiv);

  document.body.appendChild(devicePanel);
}

function updateDeviceButtons() {
  if (!devicePanel) return;

  const buttons = devicePanel.querySelectorAll("button");
  buttons.forEach((btn) => {
    const deviceSlug = btn.getAttribute("data-device");
    if (deviceSlug) {
      btn.style.background =
        deviceSlug === currentDevice ? "#007AFF" : "rgba(255, 255, 255, 0.1)";
    }
  });
}

// Create device panel when script loads
createDevicePanel();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "UPDATE_DEVICE") {
    currentDevice = message.deviceSlug;
    updateDeviceButtons();
  }
});
