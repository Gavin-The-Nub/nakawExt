// Content script for device simulation
// This script injects a floating toolbar when the simulator is active
import { DEVICES } from "../shared/devices";

let toolbar = null;
let deviceSelector = null;
let devicePanel = null;
let currentOrientation = "portrait"; // Track current orientation
let statusBarTimer = null; // interval for updating status bar time

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
        padding: 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 2147483648;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        width: 560px;
        max-width: 640px;
        min-width: 520px;
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
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
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
        white-space: normal;
        overflow: hidden;
        text-overflow: clip;
        line-height: 1.2;
        min-height: 36px;
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
    // Always ensure status bar exists before nav bar sizing
    ensureStatusBar();
    if (overlay && frame && screen && !browserNavBar) {
      browserNavBar = document.createElement("div");
      browserNavBar.id = "__mf_browser_nav_bar__";
      const platform = frame.getAttribute("data-platform") || "iOS";
      browserNavBar.style.position = "absolute";
      browserNavBar.style.left = "0";
      browserNavBar.style.right = "0";
      browserNavBar.style.zIndex = "10";
      browserNavBar.style.pointerEvents = "none";
      if (platform === "iOS") {
        // Position at bottom for iOS Safari UI
        browserNavBar.style.top = "auto";
        browserNavBar.style.bottom = "0";
        browserNavBar.style.background =
          "linear-gradient(180deg, #f9f9fb 0%, #ececf0 100%)";
        browserNavBar.style.borderTop = "0.5px solid rgba(0,0,0,0.1)";
        browserNavBar.style.display = "block";
        browserNavBar.style.padding = "8px 12px 10px";
        browserNavBar.style.fontFamily =
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        browserNavBar.style.color = "#000";
        browserNavBar.style.pointerEvents = "none";
        browserNavBar.innerHTML = `
          <div style=\"display:flex;justify-content:space-between;align-items:center;background:#EFF1F5;border-radius:10px;padding:10px 14px;margin: 0px 15px;box-shadow:0 1px 2px rgba(0,0,0,0.08);border:1px solid rgba(142,142,147,0.2);pointer-events:auto;\">
            <span style=\"display:inline-flex;margin-right:10px;color:#6b7280;\">
              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M4 7h16M4 12h16M4 17h16\"/></svg>
            </span>
            <span style=\"display:flex;align-items:center;\">
              <span style=\"display:inline-flex;margin-right:8px;color:#6b7280;\">
                <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"6\" y=\"10\" width=\"12\" height=\"10\" rx=\"2\"/><path d=\"M9 10V7a3 3 0 0 1 6 0v3\"/></svg>
              </span>
              <span style=\"flex:1;color:#111827;font-size:13px;font-weight:600;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\">${
                window.location.hostname || "www.webmobilefirst.com"
              }</span>
            </span>
            <button id=\"__mf_nav_refresh__\" style=\"margin-left:8px;padding:6px;border-radius:9999px;transition:background .2s;cursor:pointer;background:transparent;border:none;\">
              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"1 4 1 10 7 10\"/><path d=\"M3.51 15a9 9 0 1 0 2-9.36L1 10\"/></svg>
            </button>
          </div>
          <div style=\"display:flex;align-items:center;justify-content:center;gap:10%;margin-top:10px;pointer-events:auto;\">
            <div style=\"display:flex;align-items:center;gap:30px;\">
                <button id=\"__mf_nav_back__\" style=\"padding:10px;border-radius:9999px;transition:all .2s;background:transparent;border:none;color:#6b7280;cursor:pointer;\">
                  <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"15 18 9 12 15 6\"/></svg>
                </button>
                <button id=\"__mf_nav_forward__\" style=\"padding:10px;border-radius:9999px;transition:all .2s;background:transparent;border:none;color:#6b7280;cursor:pointer;\">
                  <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>
                </button>
                <button id=\"__mf_nav_share__\" style=\"padding:10px;border-radius:9999px;transition:all .2s;background:transparent;border:none;color:#6b7280;cursor:pointer;\">
                  <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"/><polyline points=\"16 6 12 2 8 6\"/><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"15\"/></svg>
                </button>
                <button id=\"__mf_nav_bookmark__\" style=\"padding:10px;border-radius:9999px;transition:all .2s;background:transparent;border:none;color:#6b7280;cursor:pointer;\">
                  <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z\"/></svg>
                </button>
                <div style=\"position:relative;\">
                  <button id=\"__mf_nav_tabs__\" style=\"padding:10px;border-radius:9999px;transition:all .2s;background:transparent;border:none;color:#6b7280;cursor:pointer;\">
                    <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"4\" width=\"14\" height=\"14\" rx=\"2\"/><rect x=\"7\" y=\"8\" width=\"14\" height=\"14\" rx=\"2\" opacity=\".6\"/></svg>
                  </button>
                  <span style=\"position:absolute;top:-4px;right:-4px;width:20px;height:20px;background:#2563eb;color:#fff;font-size:12px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:600;\">2</span>
                </div>
              </div>
          </div>
        `;
        const _b = browserNavBar.querySelector('#__mf_nav_back__');
        if (_b) _b.onclick = () => history.back();
        const _f = browserNavBar.querySelector('#__mf_nav_forward__');
        if (_f) _f.onclick = () => history.forward();
        const _r = browserNavBar.querySelector('#__mf_nav_refresh__');
        if (_r) _r.onclick = () => location.reload();
        screen.insertBefore(browserNavBar, screen.firstChild);
        adjustIframeForBars();
        return;
      } else {
        // Position at top for Android Chrome UI
        const statusBar = document.getElementById("__mf_status_bar__");
        const sbh = statusBar ? statusBar.getBoundingClientRect().height : 0;
        browserNavBar.style.top = sbh + "px";
        browserNavBar.style.bottom = "auto";
        browserNavBar.style.background = "#ffffff";
        browserNavBar.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
        browserNavBar.style.display = "block";
        browserNavBar.style.padding = "8px 10px";
        browserNavBar.style.fontFamily = "'Roboto','Noto Sans',sans-serif";
        browserNavBar.style.color = "#202124";
        browserNavBar.style.pointerEvents = "none";
        browserNavBar.innerHTML = `
          <div style=\"display:flex;align-items:center;background:#f1f3f4;border-radius:9999px;padding:8px 12px;border:1px solid rgba(0,0,0,0.06);pointer-events:auto;\">
            <span style=\"display:inline-flex;margin-right:8px;color:#5f6368;\">
              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#5f6368\" stroke-width=\"2\"><rect x=\"6\" y=\"10\" width=\"12\" height=\"10\" rx=\"2\"/><path d=\"M9 10V7a3 3 0 0 1 6 0v3\"/></svg>
            </span>
            <span style=\"flex:1;color:#202124;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\">${window.location.hostname || "www.webmobilefirst.com"}</span>
            <button id=\"__mf_nav_menu__\" style=\"margin-left:8px;padding:8px;border-radius:9999px;transition:background .2s;cursor:pointer;background:transparent;border:none;\">
              <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"#5f6368\"><path d=\"M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z\"/></svg>
            </button>
          </div>
        `;
        screen.insertBefore(browserNavBar, screen.firstChild);
        adjustIframeForBars();
        return;
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
        centerSection.style.margin = "0 12px";
        const urlBar = document.createElement("div");
        urlBar.style.background = "#f1f3f4";
        urlBar.style.borderRadius = "24px";
        urlBar.style.padding = "8px 14px";
        urlBar.style.fontSize = "14px";
        urlBar.style.color = "#5f6368";
        urlBar.style.fontWeight = "400";
        urlBar.style.maxWidth = "320px";
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

      // Position iframe below status bar and (optionally) nav bar
      adjustIframeForBars();
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
        // Keep space for status bar
        const statusBar = document.getElementById("__mf_status_bar__");
        const sbh = statusBar ? statusBar.getBoundingClientRect().height : 0;
        // iOS had nav at bottom; Android at top
        const mockupContainer = document.querySelector(
          "#__mf_simulator_frame__"
        );
        const platform =
          mockupContainer?.getAttribute("data-platform") || "iOS";
        // When nav is hidden, top inset is just status bar for both
        iframe.style.top = sbh + "px";
        iframe.style.height = `calc(100% - ${sbh}px)`;
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
        const statusBar = document.getElementById("__mf_status_bar__");
        const sbh = statusBar ? statusBar.getBoundingClientRect().height : 0;
        // iOS nav at bottom increases bottom inset; Android at top increases top inset
        const topInset = platform === "iOS" ? sbh : sbh + navBarHeight;
        const totalInset = sbh + navBarHeight;
        iframe.style.top = topInset + "px";
        iframe.style.height = `calc(100% - ${totalInset}px)`;
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
    // After everything mounts, ensure status bar layout is applied
    adjustIframeForBars();
  }, 100);
}

function createDeviceSelector() {
  deviceSelector = document.createElement("div");
  deviceSelector.id = "mf-device-selector";

  // Build full device list from shared DEVICES
  const devices = DEVICES.map((d) => ({
    slug: d.slug,
    name: d.name,
    platform: d.platform,
  }));

  // Optional: sort devices by platform then name for consistent ordering
  devices.sort((a, b) => {
    if (a.platform === b.platform) {
      return a.name.localeCompare(b.name);
    }
    return a.platform.localeCompare(b.platform);
  });

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
  // Remove status bar and timer
  const statusBar = document.getElementById("__mf_status_bar__");
  if (statusBar) statusBar.remove();
  if (statusBarTimer) {
    clearInterval(statusBarTimer);
    statusBarTimer = null;
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

// Status bar helpers
function ensureStatusBar() {
  try {
    const frame = document.getElementById("__mf_simulator_frame__");
    const screen = document.getElementById("__mf_simulator_screen__");
    if (!frame || !screen) return;

    const platform = frame.getAttribute("data-platform") || "iOS";

    // Do not show status bar on macOS devices; remove if present
    if (platform === "macOS") {
      const existing = document.getElementById("__mf_status_bar__");
      if (existing) existing.remove();
      if (statusBarTimer) {
        clearInterval(statusBarTimer);
        statusBarTimer = null;
      }
      adjustIframeForBars();
      return;
    }
    let statusBar = document.getElementById("__mf_status_bar__");
    if (!statusBar) {
      statusBar = document.createElement("div");
      statusBar.id = "__mf_status_bar__";
      statusBar.style.position = "absolute";
      statusBar.style.top = "0";
      statusBar.style.left = "0";
      statusBar.style.right = "0";
      statusBar.style.display = "flex";
      statusBar.style.alignItems = "center";
      statusBar.style.justifyContent = "space-between";
      statusBar.style.padding = platform === "iOS" ? "10px 30px" : "10px 12px";
      statusBar.style.zIndex = "9";
      statusBar.style.pointerEvents = "none";
      statusBar.style.fontFamily =
        platform === "iOS"
          ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          : "'Roboto', 'Noto Sans', sans-serif";
      statusBar.style.fontSize = platform === "iOS" ? "24px" : "12px";
      statusBar.style.color = "#000";
      statusBar.style.height = platform === "iOS" ? "50px" : "50px";
      statusBar.style.background = platform === "iOS"
        ? "linear-gradient(180deg, rgb(242, 242, 247) 0%, rgb(229, 229, 234) 100%)"
        : "#ffffff";
      statusBar.style.borderBottom =
        platform === "iOS" ? "0.5px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.08)";

      const left = document.createElement("div");
      left.id = "__mf_status_time__";
      left.textContent = getFormattedTime(platform);
      left.style.fontWeight = platform === "iOS" ? "600" : "500";
      left.style.fontSize = platform === "iOS" ? "15px" : "12px";

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "3px";

      // Signal icon
      const signal = document.createElement("div");
      signal.innerHTML = '<svg data-v-1bbbc0b8="" height="12" viewBox="0 0 13 8" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-1bbbc0b8="" d="M0.502889 7.99997H1.6763C1.97687 7.99997 2.17918 7.7861 2.17918 7.46818V5.41038C2.17918 5.09246 1.97687 4.88436 1.6763 4.88436H0.502889C0.202307 4.88436 -4.76837e-06 5.09246 -4.76837e-06 5.41038V7.46818C-4.76837e-06 7.7861 0.202307 7.99997 0.502889 7.99997ZM3.93064 7.99997H5.09826C5.39884 7.99997 5.60693 7.7861 5.60693 7.46818V3.98263C5.60693 3.67049 5.39884 3.45084 5.09826 3.45084H3.93064C3.63005 3.45084 3.42196 3.67049 3.42196 3.98263V7.46818C3.42196 7.7861 3.63005 7.99997 3.93064 7.99997ZM7.35259 7.99997H8.52023C8.8208 7.99997 9.0289 7.7861 9.0289 7.46818V2.33523C9.0289 2.01731 8.8208 1.80344 8.52023 1.80344H7.35259C7.05201 1.80344 6.84392 2.01731 6.84392 2.33523V7.46818C6.84392 7.7861 7.05201 7.99997 7.35259 7.99997ZM10.7745 7.99997H11.9537C12.2543 7.99997 12.4508 7.7861 12.4508 7.46818V0.531763C12.4508 0.21385 12.2543 -3.05176e-05 11.9537 -3.05176e-05H10.7745C10.474 -3.05176e-05 10.2717 0.21385 10.2717 0.531763V7.46818C10.2717 7.7861 10.474 7.99997 10.7745 7.99997Z" fill-opacity="0.9"></path></svg>';

      // WiFi icon
      const wifi = document.createElement("div");
      wifi.innerHTML = '<svg data-v-1bbbc0b8="" height="12" viewBox="0 0 12 8" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-1bbbc0b8="" d="M0.749444 3.40244C0.840905 3.49999 0.987249 3.49999 1.0848 3.39633C2.26164 2.14634 3.80432 1.4939 5.52994 1.4939C7.26774 1.4939 8.81652 2.15244 9.99334 3.40244C10.0787 3.4939 10.219 3.48781 10.3165 3.39024L10.9994 2.71341C11.0848 2.62195 11.0787 2.5122 11.0116 2.42683C9.88969 1.03659 7.77383 -2.38419e-07 5.52994 -2.38419e-07C3.29212 -2.38419e-07 1.17628 1.03659 0.0482247 2.42683C-0.0188486 2.5122 -0.0188485 2.62195 0.0665169 2.71341L0.749444 3.40244Z" fill-opacity="0.9"></path><path data-v-1bbbc0b8="" d="M2.73115 5.39635C2.83481 5.5061 2.97506 5.48781 3.07871 5.37805C3.63969 4.74391 4.56652 4.28049 5.52994 4.28658C6.50555 4.28049 7.42628 4.76219 8.00555 5.39635C8.09701 5.5 8.22506 5.4939 8.33482 5.39024L9.09701 4.64025C9.17628 4.56097 9.18238 4.44513 9.11531 4.35366C8.3836 3.46952 7.04824 2.78658 5.52994 2.78658C4.01165 2.78658 2.67628 3.46952 1.95066 4.35366C1.8775 4.44513 1.8775 4.54879 1.96896 4.64025L2.73115 5.39635Z" fill-opacity="0.9"></path><path data-v-1bbbc0b8="" d="M5.52995 8C5.64579 8 5.73726 7.95122 5.93238 7.7622L7.1092 6.63415C7.18238 6.56097 7.20068 6.43903 7.13361 6.35366C6.81043 5.93903 6.21896 5.57927 5.52995 5.57927C4.81653 5.57927 4.22506 5.95732 3.90799 6.39024C3.8592 6.46342 3.8836 6.56097 3.96286 6.63415L5.1275 7.7622C5.32262 7.94512 5.42018 8 5.52995 8Z" fill-opacity="0.9"></path></svg>';

      // Battery icon
      const battery = document.createElement("div");
      battery.innerHTML = '<svg data-v-1bbbc0b8="" height="12" viewBox="0 0 17 8" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-1bbbc0b8="" d="M12.2637 0C13.2122 0 14.0878 0.0810872 14.7129 0.706055C15.3301 1.32366 15.4033 2.19868 15.4033 3.13965V4.86035C15.4033 5.80118 15.33 6.67591 14.7129 7.30078C14.0878 7.9184 13.2122 8 12.2637 8H3.13965C2.19117 8 1.31637 7.9184 0.691406 7.30078C0.0738704 6.67589 1.6728e-05 5.80135 0 4.86035V3.13965C0 2.19852 0.0737872 1.32367 0.691406 0.706055C1.31637 0.0811107 2.19854 0 3.13965 0H12.2637ZM2.85156 0.868164C2.2915 0.868164 1.6399 0.93144 1.28418 1.30176C0.92867 1.68001 0.868164 2.34187 0.868164 2.9248V5.10742C0.868171 5.6825 0.92862 6.35231 1.28418 6.72266C1.6399 7.09297 2.29125 7.16406 2.84375 7.16406H12.5693C13.1218 7.16406 13.7732 7.09297 14.1289 6.72266C14.4845 6.35231 14.5449 5.6825 14.5449 5.10742V2.9248C14.5449 2.34187 14.4844 1.68001 14.1289 1.30176C13.7732 0.931444 13.1218 0.868165 12.5693 0.868164H2.85156Z" fill-opacity="0.3"></path><path data-v-1bbbc0b8="" d="M15.8472 5.54381C16.3177 5.5144 16.9502 4.9115 16.9502 3.99978C16.9502 3.08806 16.3177 2.48516 15.8472 2.45575V5.54381Z" fill-opacity="0.3"></path><rect data-v-1bbbc0b8="" x="1.3" y="1.3" width="12.81" height="5.43" rx="1.1" fill-opacity="0.9" fill=""></rect></svg>';

      right.appendChild(signal);
      right.appendChild(wifi);
      right.appendChild(battery);
      statusBar.appendChild(left);
      statusBar.appendChild(right);
      screen.insertBefore(statusBar, screen.firstChild);
    } else {
      // Update styling if platform changed
      const platform = frame.getAttribute("data-platform") || "iOS";
      statusBar.style.padding = platform === "iOS" ? "0 10px" : "0 12px";
      statusBar.style.height = platform === "iOS" ? "20px" : "24px";
      statusBar.style.background = platform === "iOS"
        ? "linear-gradient(180deg, rgb(242, 242, 247) 0%, rgb(229, 229, 234) 100%)"
        : "#ffffff";
      statusBar.style.borderBottom =
        platform === "iOS" ? "0.5px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.08)";
    }

    // Start/refresh timer for time updates
    if (statusBarTimer) clearInterval(statusBarTimer);
    statusBarTimer = setInterval(() => {
      const frame = document.getElementById("__mf_simulator_frame__");
      const platform = frame?.getAttribute("data-platform") || "iOS";
      const timeEl = document.getElementById("__mf_status_time__");
      if (timeEl) timeEl.textContent = getFormattedTime(platform);
    }, 30 * 1000); // refresh every 30s

    // Initial time set
    const timeEl = document.getElementById("__mf_status_time__");
    if (timeEl) timeEl.textContent = getFormattedTime(platform);
    // Recalculate offsets immediately and again after layout settles
    adjustIframeForBars();
    setTimeout(adjustIframeForBars, 0);

    // Watch for window resizes which can affect computed heights
    window.removeEventListener("resize", adjustIframeForBars);
    window.addEventListener("resize", adjustIframeForBars);

    // Observe status bar changes to reflow iframe when its size updates
    const sb = document.getElementById("__mf_status_bar__");
    if (sb && !sb.__observerHooked) {
      const mo = new MutationObserver(() => adjustIframeForBars());
      mo.observe(sb, { attributes: true, attributeFilter: ["style", "class"] });
      sb.__observerHooked = true;
    }
  } catch (_) {}
}

function adjustIframeForBars() {
  const iframe = document.querySelector("#__mf_simulator_screen__ iframe");
  const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
  const statusBar = document.getElementById("__mf_status_bar__");
  if (!iframe) return;
  const sbh = statusBar ? Math.ceil(statusBar.getBoundingClientRect().height) : 0;
  const navVisible =
    browserNavBar && browserNavBar.style.display !== "none";
  const mockupContainer = document.querySelector("#__mf_simulator_frame__");
  const platform = mockupContainer?.getAttribute("data-platform") || "iOS";
  // Ensure Android nav bar sits below status bar
  if (browserNavBar && platform !== "iOS") {
    browserNavBar.style.top = sbh + "px";
  }
  const navBarHeight = navVisible ? (platform === "iOS" ? 44 : 56) : 0;
  if (platform === "iOS") {
    // Status bar at top, browser nav at bottom
    iframe.style.top = sbh + "px";
    iframe.style.height = `calc(100% - ${sbh + navBarHeight}px)`;
  } else {
    // Status bar + browser nav both eat top space on Android (nav at top)
    iframe.style.top = sbh + navBarHeight + "px";
    iframe.style.height = `calc(100% - ${sbh + navBarHeight}px)`;
  }
}

function getFormattedTime(platform) {
  const d = new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${suffix}`;
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
