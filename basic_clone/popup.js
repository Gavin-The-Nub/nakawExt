(async function () {
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  // Load current device selection
  const deviceSelect = document.getElementById("device");
  const tab = await getActiveTab();
  const response = await chrome.runtime.sendMessage({
    type: "GET_TAB_STATE",
    tabId: tab.id,
  });
  if (response && response.deviceSlug) {
    deviceSelect.value = response.deviceSlug;
  }

  deviceSelect.addEventListener("change", async () => {
    const tab = await getActiveTab();
    chrome.runtime.sendMessage({
      type: "SET_DEVICE_FOR_TAB",
      tabId: tab.id,
      deviceSlug: deviceSelect.value,
    });
  });

  document
    .getElementById("toggle-simulator")
    .addEventListener("click", async () => {
      const tab = await getActiveTab();
      chrome.runtime.sendMessage(
        { type: "TOGGLE_SIMULATOR_FOR_TAB", tabId: tab.id },
        () => {}
      );
    });

  document
    .getElementById("toggle-scrollbar")
    .addEventListener("click", async () => {
      const tab = await getActiveTab();
      chrome.runtime.sendMessage(
        { type: "TOGGLE_SCROLLBAR_FOR_TAB", tabId: tab.id },
        () => {}
      );
    });
})();
