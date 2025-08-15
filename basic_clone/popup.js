(async function () {
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  // Load current device selection and update UI
  const deviceSelect = document.getElementById("device");
  const currentDeviceSpan = document.getElementById("current-device");
  const currentViewportSpan = document.getElementById("current-viewport");
  const toggleSimulatorBtn = document.getElementById("toggle-simulator");
  const toggleScrollbarBtn = document.getElementById("toggle-scrollbar");
  
  const tab = await getActiveTab();
  const response = await chrome.runtime.sendMessage({
    type: "GET_TAB_STATE",
    tabId: tab.id,
  });
  
  if (response && response.deviceSlug) {
    deviceSelect.value = response.deviceSlug;
    updateDeviceInfo(response.deviceSlug);
  }
  
  // Update button states
  if (response) {
    updateButtonStates(response);
  }

  function updateDeviceInfo(deviceSlug) {
    const devices = {
      "iphone-15-pro": { name: "iPhone 15 Pro", viewport: "369×750" },
      "macbook-pro": { name: "MacBook Pro", viewport: "750×431" }
    };
    
    const device = devices[deviceSlug] || devices["iphone-15-pro"];
    currentDeviceSpan.textContent = device.name;
    currentViewportSpan.textContent = device.viewport;
  }

  function updateButtonStates(state) {
    if (state.simulator) {
      toggleSimulatorBtn.textContent = "Hide Device Simulator";
      toggleSimulatorBtn.classList.add("active");
    } else {
      toggleSimulatorBtn.textContent = "Show Device Simulator";
      toggleSimulatorBtn.classList.remove("active");
    }
    
    if (state.showScrollbar) {
      toggleScrollbarBtn.textContent = "Hide Scrollbar";
      toggleScrollbarBtn.classList.add("active");
    } else {
      toggleScrollbarBtn.textContent = "Show Scrollbar";
      toggleScrollbarBtn.classList.remove("active");
    }
  }

  deviceSelect.addEventListener("change", async () => {
    const tab = await getActiveTab();
    const deviceSlug = deviceSelect.value;
    
    updateDeviceInfo(deviceSlug);
    
    chrome.runtime.sendMessage({
      type: "SET_DEVICE_FOR_TAB",
      tabId: tab.id,
      deviceSlug: deviceSlug,
    });
  });

  toggleSimulatorBtn.addEventListener("click", async () => {
    const tab = await getActiveTab();
    chrome.runtime.sendMessage(
      { type: "TOGGLE_SIMULATOR_FOR_TAB", tabId: tab.id },
      (response) => {
        if (response) {
          updateButtonStates(response);
        }
      }
    );
  });

  toggleScrollbarBtn.addEventListener("click", async () => {
    const tab = await getActiveTab();
    chrome.runtime.sendMessage(
      { type: "TOGGLE_SCROLLBAR_FOR_TAB", tabId: tab.id },
      (response) => {
        if (response) {
          updateButtonStates(response);
        }
      }
    );
  });
})();
