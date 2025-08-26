// Content script for device simulation
// This script injects a floating toolbar when the simulator is active

let toolbar = null;
let deviceSelector = null;
let devicePanel = null;
let currentOrientation = "portrait"; // Track current orientation

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, device, showScrollbar, orientation, platform } = message;

  switch (type) {
    case "SIMULATOR_ACTIVATED":
      currentOrientation = orientation || "portrait";
      injectToolbar();
      // Set initial state of browser navigation toggle button
      setTimeout(() => {
        const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
        const button = document.getElementById("mf-btn-browser-nav");
        if (browserNavBar && button) {
          // In landscape mode, navigation bar is hidden by default
          if (orientation === "landscape") {
            button.classList.remove("selected");
          } else {
            button.classList.add("selected");
          }
        }
      }, 100); // Small delay to ensure elements are created
      break;

    case "SIMULATOR_DEACTIVATED":
      removeToolbar();
      // Reset browser navigation toggle button state
      currentOrientation = "portrait";
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
        // Update browser navigation toggle button state after device change
        setTimeout(() => {
          const browserNavBar = document.getElementById(
            "__mf_browser_nav_bar__"
          );
          const button = document.getElementById("mf-btn-browser-nav");
          if (browserNavBar && button) {
            if (currentOrientation === "landscape") {
              button.classList.remove("selected");
            } else {
              button.classList.add("selected");
            }
          }
        }, 50); // Additional delay to ensure browser nav bar is created
      }, 100); // Small delay to ensure overlay recreation is complete
      break;

    case "ORIENTATION_CHANGED":
      currentOrientation = orientation || "portrait";
      updateToolbarOrientation();
      // Update browser navigation toggle button state based on orientation
      setTimeout(() => {
        const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
        const button = document.getElementById("mf-btn-browser-nav");
        if (browserNavBar && button) {
          if (orientation === "landscape") {
            button.classList.remove("selected");
          } else {
            button.classList.add("selected");
          }
        }
      }, 100);
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
      .mf-toolbar-btn.recording {
        background: #f44336;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
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
      
      .orientation-indicator {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: #ff6b6b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
        border: 2px solid #333;
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
      
      .recording-status {
        position: fixed;
        top: 60px;
        right: 100px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 2147483649;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
    </style>
    <button class="mf-toolbar-btn" id="mf-btn-close" title="Close Simulator">
      <svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-device" title="Device Mode">
      <svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1.5"/></svg>
    </button>
  
    <button class="mf-toolbar-btn" id="mf-btn-rotate" title="Rotate to Landscape" style="position: relative;">
      <svg viewBox="0 0 24 24"><path d="M2 12A10 10 0 1 1 12 22"/><polyline points="2 12 2 6 8 6"/></svg>
      <div class="orientation-indicator">P</div>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-screenshot" title="Screenshot">
      <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-record" title="Record">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>
    </button>
    <button class="mf-toolbar-btn" id="mf-btn-browser-nav" title="Toggle Browser Navigation">
      <svg viewBox="0 0 24 24"><path d="M3 7H21V9H3V7ZM3 11H21V13H3V11ZM3 15H21V17H3V15Z" stroke="currentColor" stroke-width="1.5"/></svg>
    </button>
    <div id="mf-recording-status" class="recording-status" style="display: none;"></div>
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

  // Inject browser navigation bar if not present
  setTimeout(() => {
    const overlay = document.getElementById("__mf_simulator_overlay__");
    const frame = document.getElementById("__mf_simulator_frame__");
    const screen = document.getElementById("__mf_simulator_screen__");
    let browserNavBar = document.getElementById("__mf_browser_nav_bar__");
    if (overlay && frame && screen && !browserNavBar) {
      browserNavBar = document.createElement("div");
      browserNavBar.id = "__mf_browser_nav_bar__";
      const platform = frame.getAttribute("data-platform") || "iOS";
      browserNavBar.style.position = "absolute";
      browserNavBar.style.top = "0";
      browserNavBar.style.left = "0";
      browserNavBar.style.right = "0";
      browserNavBar.style.zIndex = "10";
      browserNavBar.style.pointerEvents = "none";
      if (platform === "iOS") {
        browserNavBar.style.height = "44px";
        browserNavBar.style.background =
          "linear-gradient(180deg, #f2f2f7 0%, #e5e5ea 100%)";
        browserNavBar.style.borderBottom = "0.5px solid #c6c6c8";
        browserNavBar.style.display = "flex";
        browserNavBar.style.alignItems = "center";
        browserNavBar.style.justifyContent = "space-between";
        browserNavBar.style.padding = "0 8px";
        browserNavBar.style.fontFamily =
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        browserNavBar.style.fontSize = "17px";
        browserNavBar.style.fontWeight = "600";
        browserNavBar.style.color = "#000";
        // Left section
        const leftSection = document.createElement("div");
        leftSection.style.display = "flex";
        leftSection.style.alignItems = "center";
        leftSection.style.gap = "8px";
        leftSection.style.flex = "1";
        const backBtn = document.createElement("div");
        backBtn.innerHTML = `<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M15 18L9 12L15 6' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
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
        // Center section
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
        // Right section
        const rightSection = document.createElement("div");
        rightSection.style.display = "flex";
        rightSection.style.alignItems = "center";
        rightSection.style.gap = "8px";
        rightSection.style.flex = "1";
        rightSection.style.justifyContent = "flex-end";
        const shareBtn = document.createElement("div");
        shareBtn.innerHTML = `<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 6L12 2L8 6' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 2V15' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
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
        tabsBtn.innerHTML = `<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='3' y='3' width='7' height='9' rx='1' stroke='currentColor' stroke-width='2'/><rect x='10' y='3' width='7' height='9' rx='1' stroke='currentColor' stroke-width='2'/><rect x='17' y='3' width='4' height='9' rx='1' stroke='currentColor' stroke-width='2'/></svg>`;
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
        browserNavBar.appendChild(leftSection);
        browserNavBar.appendChild(centerSection);
        browserNavBar.appendChild(rightSection);
      } else {
        // Android Chrome Navigation Bar
        browserNavBar.style.height = "56px";
        browserNavBar.style.background = "#ffffff";
        browserNavBar.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
        browserNavBar.style.display = "flex";
        browserNavBar.style.alignItems = "center";
        browserNavBar.style.justifyContent = "space-between";
        browserNavBar.style.padding = "0 8px";
        browserNavBar.style.fontFamily = "'Roboto', 'Noto Sans', sans-serif";
        browserNavBar.style.fontSize = "16px";
        browserNavBar.style.color = "#000";
        // Left section
        const leftSection = document.createElement("div");
        leftSection.style.display = "flex";
        leftSection.style.alignItems = "center";
        leftSection.style.gap = "8px";
        const backBtn = document.createElement("div");
        backBtn.innerHTML = `<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z' fill='currentColor'/></svg>`;
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
        // Center section
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
        lockIcon.innerHTML = `<svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z' fill='#34a853'/></svg>`;
        const urlText = document.createElement("span");
        urlText.textContent = window.location.hostname || "example.com";
        urlBar.appendChild(lockIcon);
        urlBar.appendChild(urlText);
        centerSection.appendChild(urlBar);
        // Right section
        const rightSection = document.createElement("div");
        rightSection.style.display = "flex";
        rightSection.style.alignItems = "center";
        rightSection.style.gap = "8px";
        const moreBtn = document.createElement("div");
        moreBtn.innerHTML = `<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 16.9 14 18C14 19.1 13.1 16 12 16Z' fill='currentColor'/></svg>`;
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
        tabsBtn.innerHTML = `<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z' fill='currentColor'/><path d='M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z' fill='currentColor'/></svg>`;
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
        browserNavBar.appendChild(leftSection);
        browserNavBar.appendChild(centerSection);
        browserNavBar.appendChild(rightSection);
      }
      screen.insertBefore(browserNavBar, screen.firstChild);
    }
  }, 100);

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

  document.getElementById("mf-btn-rotate").onclick = () => {
    // Implement rotate functionality with visual animation (like basic_clone)
    try {
      // Get current orientation from frame attribute (fallback to tracked state)
      const frame = document.getElementById("__mf_simulator_frame__");
      const frameOrientation = frame?.getAttribute("data-orientation");
      const isCurrentlyLandscape =
        (frameOrientation || currentOrientation) === "landscape";

      // Find the mockup container and do a brief visual rotation
      const mockupContainer = document.querySelector("#__mf_simulator_frame__");
      if (mockupContainer) {
        // Match basic_clone behavior: brief rotate then toggle orientation
        const direction = isCurrentlyLandscape ? -90 : 90;
        mockupContainer.style.transform = `rotate(${direction}deg)`;

        // Send message after animation completes
        setTimeout(async () => {
          try {
            await chrome.runtime.sendMessage({
              type: "TOGGLE_ORIENTATION_FOR_TAB",
              tabId: null,
            });
          } catch (_) {}
        }, 230);
      } else {
        // Fallback: send message immediately if no mockup found
        chrome.runtime.sendMessage({
          type: "TOGGLE_ORIENTATION_FOR_TAB",
          tabId: null,
        });
      }
    } catch (e) {
      console.error("Rotation error:", e);
      // Fallback: send message immediately on error
      chrome.runtime.sendMessage({
        type: "TOGGLE_ORIENTATION_FOR_TAB",
        tabId: null,
      });
    }
  };

  document.getElementById("mf-btn-screenshot").onclick = () => {
    // Screenshot action - implement actual functionality
    const frameEl = document.getElementById("__mf_simulator_frame__");
    const screenEl = document.getElementById("__mf_simulator_screen__");
    const mockupImgEl = document.getElementById("__mf_simulator_mockup__");

    if (!frameEl || !screenEl || !mockupImgEl) {
      return alert(
        "Simulator elements not found. Please ensure the simulator is active."
      );
    }

    const frameRect = frameEl.getBoundingClientRect(); // relative to viewport
    const screenRect = screenEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Ask background to capture the visible tab as PNG dataUrl
    chrome.runtime.sendMessage({ type: "CAPTURE_TAB" }, async (resp) => {
      try {
        if (!resp || !resp.ok) {
          console.error("Capture failed", resp && resp.error);
          return alert(
            "Screenshot failed: " +
              (resp && resp.error ? resp.error : "unknown")
          );
        }

        const dataUrl = resp.dataUrl;
        const fullTabImg = new Image();
        fullTabImg.onload = async () => {
          try {
            // Create canvas sized to the mockup frame in device pixels with alpha
            const cw = Math.round(frameRect.width * dpr);
            const ch = Math.round(frameRect.height * dpr);
            const canvas = document.createElement("canvas");
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext("2d");

            // Draw only the screen area (cropped from the full tab image)
            const sxScreen = Math.round(screenRect.left * dpr);
            const syScreen = Math.round(screenRect.top * dpr);
            const sw = Math.round(screenRect.width * dpr);
            const sh = Math.round(screenRect.height * dpr);
            const dx = Math.round((screenRect.left - frameRect.left) * dpr);
            const dy = Math.round((screenRect.top - frameRect.top) * dpr);
            ctx.drawImage(
              fullTabImg,
              sxScreen,
              syScreen,
              sw,
              sh,
              dx,
              dy,
              sw,
              sh
            );

            // Load the device image as a safe same-origin blob to avoid canvas tainting
            let deviceBlobUrl;
            try {
              const res = await fetch(mockupImgEl.src);
              const blob = await res.blob();
              deviceBlobUrl = URL.createObjectURL(blob);
            } catch (e) {
              console.error("Failed to fetch device image", e);
              return alert("Failed to fetch device image for compositing.");
            }

            await new Promise((resolve, reject) => {
              const deviceImg = new Image();
              deviceImg.onload = () => {
                try {
                  // Get current orientation from the mockup container or use currentOrientation
                  const orientation =
                    frameEl.getAttribute("data-orientation") ||
                    currentOrientation ||
                    "portrait";

                  // Draw device bezel on top (keeps transparent outside)
                  if (orientation === "landscape") {
                    ctx.save();
                    ctx.translate(cw / 2, ch / 2);
                    ctx.rotate(Math.PI / 2);
                    // After rotation, width/height swapped
                    ctx.drawImage(deviceImg, -ch / 2, -cw / 2, ch, cw);
                    ctx.restore();
                  } else {
                    ctx.drawImage(deviceImg, 0, 0, cw, ch);
                  }
                } finally {
                  try {
                    URL.revokeObjectURL(deviceBlobUrl);
                  } catch (_) {}
                  resolve();
                }
              };
              deviceImg.onerror = (err) => reject(err);
              deviceImg.src = deviceBlobUrl;
            });

            // Convert to blob
            canvas.toBlob(async (blob) => {
              if (!blob) {
                return alert("Failed to create screenshot blob.");
              }

              // Build a small floating menu next to the toolbar
              const menu = document.createElement("div");
              menu.style.position = "fixed";
              menu.style.right = "100px"; // slightly left of toolbar
              menu.style.top = "60px";
              menu.style.zIndex = "2147483649";
              menu.style.display = "flex";
              menu.style.flexDirection = "column";
              menu.style.gap = "8px";
              menu.style.padding = "10px";
              menu.style.borderRadius = "10px";
              menu.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
              menu.style.background = "rgba(30,30,30,0.85)";
              menu.style.color = "white";
              menu.style.alignItems = "center";

              const downloadBtn = document.createElement("button");
              downloadBtn.textContent = "Download";
              downloadBtn.style.padding = "8px 12px";
              downloadBtn.style.border = "none";
              downloadBtn.style.borderRadius = "8px";
              downloadBtn.style.cursor = "pointer";
              downloadBtn.style.background = "#007AFF";
              downloadBtn.style.color = "white";
              downloadBtn.style.fontSize = "14px";

              const copyBtn = document.createElement("button");
              copyBtn.textContent = "Copy";
              copyBtn.style.padding = "8px 12px";
              copyBtn.style.border = "none";
              copyBtn.style.borderRadius = "8px";
              copyBtn.style.cursor = "pointer";
              copyBtn.style.background = "#34C759";
              copyBtn.style.color = "white";
              copyBtn.style.fontSize = "14px";

              const closeBtnSmall = document.createElement("button");
              closeBtnSmall.textContent = "Close";
              closeBtnSmall.style.padding = "6px 10px";
              closeBtnSmall.style.border = "none";
              closeBtnSmall.style.borderRadius = "8px";
              closeBtnSmall.style.cursor = "pointer";
              closeBtnSmall.style.background = "#FF3B30";
              closeBtnSmall.style.color = "white";
              closeBtnSmall.style.fontSize = "14px";

              // Download behavior
              downloadBtn.onclick = () => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "mockup-screenshot.png";
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                menu.remove();
              };

              // Copy behavior (Clipboard API)
              copyBtn.onclick = async () => {
                try {
                  await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                  ]);
                  copyBtn.textContent = "Copied!";
                  setTimeout(() => {
                    try {
                      copyBtn.textContent = "Copy";
                    } catch (e) {}
                    menu.remove();
                  }, 900);
                } catch (err) {
                  console.error("Copy failed", err);
                  alert(
                    "Copy to clipboard failed: " +
                      (err && err.message ? err.message : err)
                  );
                }
              };

              closeBtnSmall.onclick = () => menu.remove();

              menu.appendChild(downloadBtn);
              menu.appendChild(copyBtn);
              menu.appendChild(closeBtnSmall);
              document.body.appendChild(menu);

              // Auto-remove menu if user clicks elsewhere
              const onDocClick = (ev) => {
                if (
                  !menu.contains(ev.target) &&
                  ev.target !== document.getElementById("mf-btn-screenshot")
                ) {
                  menu.remove();
                  document.removeEventListener("mousedown", onDocClick);
                }
              };
              document.addEventListener("mousedown", onDocClick);
            }, "image/png");
          } catch (e) {
            console.error("Processing failed", e);
            alert("Screenshot processing failed: " + e.message);
          }
        };
        fullTabImg.onerror = (e) => {
          console.error("Image load error", e);
          alert("Failed to load captured image.");
        };
        fullTabImg.src = dataUrl;
      } catch (error) {
        console.error("Screenshot error:", error);
        alert("Screenshot failed: " + error.message);
      }
    });
  };

  document.getElementById("mf-btn-record").onclick = () => {
    const recordBtn = document.getElementById("mf-btn-record");
    const isCurrentlyRecording = recordBtn.classList.contains("recording");

    if (isCurrentlyRecording) {
      console.log("Stopping recording...");
      stopRecording();
      recordBtn.classList.remove("recording");
      recordBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`;
      recordBtn.title = "Record";
      showRecordingStatus(
        "Recording completed! Check downloads folder.",
        "success"
      );
    } else {
      console.log("Starting recording...");
      recordBtn.classList.add("recording");
      recordBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
      recordBtn.title = "Stop Recording";

      const frameEl = document.getElementById("__mf_simulator_frame__");
      const screenEl = document.getElementById("__mf_simulator_screen__");

      if (!frameEl || !screenEl) {
        showRecordingStatus(
          "Simulator elements not found. Please ensure the simulator is active.",
          "error"
        );
        recordBtn.classList.remove("recording");
        recordBtn.classList.remove("recording");
        recordBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`;
        recordBtn.title = "Record";
        return;
      }

      // Get simulator bounds for offscreen recording
      const frameRect = frameEl.getBoundingClientRect();
      const screenRect = screenEl.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const mockupBounds = {
        frame: {
          x: Math.round(frameRect.left * dpr),
          y: Math.round(frameRect.top * dpr),
          width: Math.round(frameRect.width * dpr),
          height: Math.round(frameRect.height * dpr),
        },
        screen: {
          x: Math.round(screenRect.left * dpr),
          y: Math.round(screenRect.top * dpr),
          width: Math.round(screenRect.width * dpr),
          height: Math.round(screenRect.height * dpr),
        },
        page: {
          cssWidth:
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth ||
            0,
          cssHeight:
            window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight ||
            0,
          dpr: dpr,
        },
        orientation: currentOrientation || "portrait",
      };

      // Start offscreen recording
      startOffscreenRecording(mockupBounds);
    }
  };

  document.getElementById("mf-btn-browser-nav").onclick = () => {
    // Toggle browser navigation bar visibility
    const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
    const iframe = document.querySelector("#__mf_simulator_screen__ iframe");
    const button = document.getElementById("mf-btn-browser-nav");

    if (browserNavBar && iframe) {
      const isVisible = browserNavBar.style.display !== "none";

      if (isVisible) {
        // Hide the navigation bar
        browserNavBar.style.display = "none";
        iframe.style.top = "0px";
        iframe.style.height = "100%";
        button.classList.remove("selected");
      } else {
        // Show the navigation bar
        browserNavBar.style.display = "flex";
        // Get platform from the mockup container data attribute or infer from device
        const mockupContainer = document.querySelector(
          "#__mf_simulator_frame__"
        );
        const platform =
          mockupContainer?.getAttribute("data-platform") || "iOS";
        const navBarHeight = platform === "iOS" ? 44 : 56;
        iframe.style.top = navBarHeight + "px";
        iframe.style.height = `calc(100% - ${navBarHeight}px)`;
        button.classList.add("selected");
      }
    }
  };

  // Update orientation indicator after toolbar is created
  updateToolbarOrientation();

  // Set initial state of browser navigation toggle button
  setTimeout(() => {
    const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
    const button = document.getElementById("mf-btn-browser-nav");
    if (browserNavBar && button) {
      if (currentOrientation === "landscape") {
        button.classList.remove("selected");
      } else {
        button.classList.add("selected");
      }
    }
  }, 100);
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

function updateToolbarOrientation() {
  // Update the rotate button to show current orientation
  const rotateBtn = document.getElementById("mf-btn-rotate");
  if (rotateBtn) {
    if (currentOrientation === "landscape") {
      rotateBtn.title = "Rotate to Portrait";
      rotateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" style="transform: rotate(90deg);">
          <path d="M2 12A10 10 0 1 1 12 22"/><polyline points="2 12 2 6 8 6"/>
        </svg>
      `;
      rotateBtn.querySelector(".orientation-indicator").textContent = "L";
    } else {
      rotateBtn.title = "Rotate to Landscape";
      rotateBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M2 12A10 10 0 1 1 12 22"/><polyline points="2 12 2 6 8 6"/>
        </svg>
      `;
      rotateBtn.querySelector(".orientation-indicator").textContent = "P";
    }
  }

  // Update browser navigation toggle button state based on orientation
  const browserNavToggleBtn = document.getElementById("mf-btn-browser-nav");
  if (browserNavToggleBtn) {
    if (currentOrientation === "landscape") {
      browserNavToggleBtn.classList.remove("selected");
    } else {
      browserNavToggleBtn.classList.add("selected");
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
  // Reset orientation state
  currentOrientation = "portrait";
}

function showRecordingStatus(message, type = "info") {
  const statusDiv = document.getElementById("mf-recording-status");
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = "recording-status";
    if (type === "success") {
      statusDiv.style.color = "#4CAF50";
    } else if (type === "error") {
      statusDiv.style.color = "#F44336";
    } else {
      statusDiv.style.color = "#2196F3";
    }
    statusDiv.style.display = "block";
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000); // Hide after 3 seconds
  }
}

// Offscreen recording functionality
let isRecording = false;
let recordingStartTime = null;

function startOffscreenRecording(mockupBounds) {
  if (isRecording) return;

  console.log("Starting offscreen recording with bounds:", mockupBounds);

  // Send message to background script to start recording
  chrome.runtime.sendMessage(
    {
      type: "START_RECORDING",
      mockupBounds: mockupBounds,
    },
    (response) => {
      if (response && response.ok) {
        console.log("Offscreen recording started successfully");
        isRecording = true;
        recordingStartTime = Date.now();
        showRecordingStatus("Recording started...", "info");
      } else {
        console.error("Failed to start offscreen recording:", response?.error);
        showRecordingStatus(
          "Failed to start recording: " + (response?.error || "unknown error"),
          "error"
        );

        // Reset button state on failure
        const recordBtn = document.getElementById("mf-btn-record");
        if (recordBtn) {
          recordBtn.classList.remove("recording");
          recordBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`;
          recordBtn.title = "Record";
        }
      }
    }
  );
}

function stopRecording() {
  if (!isRecording) return;

  console.log("Stopping offscreen recording...");

  // Send message to background script to stop recording
  chrome.runtime.sendMessage({ type: "STOP_RECORDING" }, (response) => {
    if (response && response.ok) {
      console.log("Offscreen recording stopped successfully");
      isRecording = false;

      // Wait a moment for video processing, then show download option
      setTimeout(() => {
        showRecordingStatus("Processing video...", "info");

        // Check for video completion
        checkVideoCompletion();
      }, 1000);
    } else {
      console.error("Failed to stop offscreen recording:", response?.error);
      showRecordingStatus(
        "Failed to stop recording: " + (response?.error || "unknown error"),
        "error"
      );
      isRecording = false;
    }
  });
}

function checkVideoCompletion() {
  // Check recording status from background script
  chrome.runtime.sendMessage({ type: "GET_RECORDING_STATUS" }, (response) => {
    if (response && response.isRecording === false && response.videoBlobData) {
      // Video is ready, show download option
      showVideoDownload(response.videoBlobData);
    } else if (response && response.isRecording === false) {
      // Recording stopped but no video yet, wait a bit more
      setTimeout(checkVideoCompletion, 500);
    } else {
      // Still recording or error
      showRecordingStatus("Video processing complete!", "success");
    }
  });
}

function showVideoDownload(videoBlobData) {
  showRecordingStatus("Video ready! Click to download.", "success");

  // Reconstruct the blob from base64 data
  const binaryString = atob(videoBlobData.base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const videoBlob = new Blob([bytes], {
    type: videoBlobData.type || "video/webm",
  });

  // Create download link
  const downloadUrl = URL.createObjectURL(videoBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = `simulator-recording-${Date.now()}.webm`;
  downloadLink.style.display = "none";

  // Auto-click the download link
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Clean up the blob URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 5000);

  showRecordingStatus("Download started!", "success");
}
