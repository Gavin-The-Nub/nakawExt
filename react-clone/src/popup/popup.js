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
    document.getElementById("loading-section").classList.add("hidden");
    document.getElementById("main-section").classList.add("visible");

    // Load current device selection and update UI
    const deviceSelect = document.getElementById("device");
    const toggleScrollbarBtn = document.getElementById("toggle-scrollbar");

    // Populate device select with all available devices
    const DEVICES = [
      { slug: "ip16", name: "iPhone 16" },
      { slug: "ip15", name: "iPhone 15" },
      { slug: "ip14", name: "iPhone 14" },
      { slug: "ip13", name: "iPhone 13" },
      { slug: "ip12", name: "iPhone 12" },
      { slug: "ip11", name: "iPhone 11" },
      { slug: "gpixel8", name: "Google Pixel 8" },
      { slug: "gpixel6", name: "Google Pixel 6" },
      { slug: "gpixel5", name: "Google Pixel 5" },
      { slug: "mb-air", name: "MacBook Air" },
      { slug: "apple-imac", name: "Apple iMac" },
      { slug: "dell14", name: "Dell Latitude" },
      { slug: "applewatch", name: "Apple Watch" },
      { slug: "hp30", name: "Huawei P30 Pro" },
    ];

    DEVICES.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.slug;
      option.textContent = device.name;
      deviceSelect.appendChild(option);
    });

    const response = await chrome.runtime.sendMessage({
      type: "GET_TAB_STATE",
      tabId: tab.id,
    });

    if (response && response.deviceSlug) {
      deviceSelect.value = response.deviceSlug;
    }

    // Update button states
    if (response) {
      updateButtonStates(response);
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
