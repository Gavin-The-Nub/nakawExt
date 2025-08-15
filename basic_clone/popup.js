(async function () {
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  const tab = await getActiveTab();
  
  // Automatically activate simulator when popup opens
  try {
    await chrome.runtime.sendMessage({
      type: "ACTIVATE_SIMULATOR_FOR_TAB",
      tabId: tab.id,
    });
    
    // Close popup after activating simulator so user can see it immediately
    setTimeout(() => {
      window.close();
    }, 100);
  } catch (error) {
    console.error("Failed to activate simulator:", error);
    // If activation fails, show the normal popup interface
    showPopupInterface();
  }

  async function showPopupInterface() {
    // Hide loading section and show main section
    document.getElementById('loading-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
    
    // Load current device selection and update UI
    const deviceSelect = document.getElementById("device");
    const currentDeviceSpan = document.getElementById("current-device");
    const currentViewportSpan = document.getElementById("current-viewport");
    const simulatorStatusSpan = document.getElementById("simulator-status");
    const toggleScrollbarBtn = document.getElementById("toggle-scrollbar");
    
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
      simulatorStatusSpan.textContent = "Simulator Active";
    }

    function updateButtonStates(state) {
      if (state.showScrollbar) {
        toggleScrollbarBtn.textContent = "Hide Scrollbar";
        toggleScrollbarBtn.classList.add("active");
      } else {
        toggleScrollbarBtn.textContent = "Show Scrollbar";
        toggleScrollbarBtn.classList.remove("active");
      }
    }

    deviceSelect.addEventListener("change", async () => {
      const deviceSlug = deviceSelect.value;
      
      updateDeviceInfo(deviceSlug);
      
      chrome.runtime.sendMessage({
        type: "SET_DEVICE_FOR_TAB",
        tabId: tab.id,
        deviceSlug: deviceSlug,
      });
    });

    toggleScrollbarBtn.addEventListener("click", async () => {
      chrome.runtime.sendMessage(
        { type: "TOGGLE_SCROLLBAR_FOR_TAB", tabId: tab.id },
        (response) => {
          if (response) {
            updateButtonStates(response);
          }
        }
      );
    });
  }
})();



