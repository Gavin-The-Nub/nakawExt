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
        const statusBarBtn = document.getElementById("mf-btn-status-bar");
        if (browserNavBar && button) {
          // In landscape mode, navigation bar is hidden by default
          if (orientation === "landscape") {
            button.classList.remove("selected");
          } else {
            button.classList.add("selected");
          }
        }
        // Status bar is visible by default unless platform is macOS
        const statusBar = document.getElementById("__mf_status_bar__");
        if (statusBarBtn) {
          if (statusBar && statusBar.style.display !== "none") {
            statusBarBtn.classList.add("selected");
          } else {
            statusBarBtn.classList.remove("selected");
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
        // Recreate browser navigation bar for new device platform
        setTimeout(() => {
          const existingNavBar = document.getElementById(
            "__mf_browser_nav_bar__"
          );
          if (existingNavBar) {
            existingNavBar.remove();
          }
          // Re-inject browser navigation bar with new platform
          injectBrowserNavigationBar();
        }, 100); // Delay to ensure overlay recreation is complete

        // Update browser navigation toggle button state after device change
        setTimeout(() => {
          const browserNavBar = document.getElementById(
            "__mf_browser_nav_bar__"
          );
          const button = document.getElementById("mf-btn-browser-nav");
          const statusBarBtn = document.getElementById("mf-btn-status-bar");
          if (browserNavBar && button) {
            if (currentOrientation === "landscape") {
              button.classList.remove("selected");
            } else {
              button.classList.add("selected");
            }
          }
          // Sync status bar button
          const statusBar = document.getElementById("__mf_status_bar__");
          if (statusBarBtn) {
            if (statusBar && statusBar.style.display !== "none") {
              statusBarBtn.classList.add("selected");
            } else {
              statusBarBtn.classList.remove("selected");
            }
          }
        }, 150); // Additional delay to ensure browser nav bar is created
      }, 100); // Small delay to ensure overlay recreation is complete
      break;

    case "ORIENTATION_CHANGED":
      currentOrientation = orientation || "portrait";
      updateToolbarOrientation();
      // Update browser navigation toggle button state based on orientation
      setTimeout(() => {
        const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
        const button = document.getElementById("mf-btn-browser-nav");
        const statusBarBtn = document.getElementById("mf-btn-status-bar");
        if (browserNavBar && button) {
          if (orientation === "landscape") {
            button.classList.remove("selected");
          } else {
            button.classList.add("selected");
          }
        }
        // Sync status bar button
        const statusBar = document.getElementById("__mf_status_bar__");
        if (statusBarBtn) {
          if (statusBar && statusBar.style.display !== "none") {
            statusBarBtn.classList.add("selected");
          } else {
            statusBarBtn.classList.remove("selected");
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
        max-height: 80vh;
        overflow-y: auto;
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
      /* Settings panel */
      #mf-settings-panel {
        position: fixed;
        top: 60px;
        right: 100px;
        z-index: 2147483648;
        width: 360px;
        max-height: 80vh;
        overflow-y: auto;
        background: #111827;
        color: #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.08);
        display: none;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #mf-settings-panel .mf-sp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        position: sticky;
        top: 0;
        background: rgba(17,24,39,0.9);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
      }
      #mf-settings-panel .mf-sp-title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: .02em;
        color: #f9fafb;
      }
      #mf-settings-panel .mf-sp-close {
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
      }
      #mf-settings-panel .mf-sp-close:hover { color: #e5e7eb; background: rgba(255,255,255,0.06); }
      #mf-settings-panel .mf-sp-body { padding: 12px 16px 16px; }
      #mf-settings-panel .mf-sp-section { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
      #mf-settings-panel .mf-sp-section:last-child { border-bottom: none; }
      #mf-settings-panel .mf-sp-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      #mf-settings-panel .mf-sp-label { display: flex; flex-direction: column; gap: 4px; }
      #mf-settings-panel .mf-sp-label .title { font-size: 13px; font-weight: 600; color: #f3f4f6; }
      #mf-settings-panel .mf-sp-label .desc { font-size: 12px; color: #9ca3af; }
      #mf-settings-panel .mf-sp-toggle { width: 44px; height: 26px; background: #374151; border-radius: 9999px; position: relative; cursor: pointer; transition: all .2s; flex-shrink: 0; }
      #mf-settings-panel .mf-sp-toggle .dot { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #e5e7eb; border-radius: 50%; transition: all .2s; }
      #mf-settings-panel .mf-sp-toggle.active { background: #2563eb; }
      #mf-settings-panel .mf-sp-toggle.active .dot { left: 21px; background: #fff; }
      #mf-settings-panel .mf-sp-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #374151; border-radius: 9999px; outline: none; }
      #mf-settings-panel .mf-sp-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #60a5fa; cursor: pointer; box-shadow: 0 0 0 4px rgba(37,99,235,0.2); border: 2px solid #1d4ed8; }
      #mf-settings-panel .mf-sp-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #60a5fa; border: 2px solid #1d4ed8; }
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
    
    <button class="mf-toolbar-btn" id="mf-btn-settings" title="Settings">
      <svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.42 1.25 1.04 1.47.21.08.45.12.69.12H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
    </button>
    <div id="mf-recording-status" class="recording-status" style="display: none;"></div>
    <div id="mf-settings-panel">
      <div class="mf-sp-header">
        <div class="mf-sp-title">Simulator Settings</div>
        <button class="mf-sp-close" id="mf-sp-close" title="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="mf-sp-body">
        <div class="mf-sp-section">
          <div class="mf-sp-row" style="margin-bottom:10px;">
            <div class="mf-sp-label">
              <div class="title">Status Bar</div>
              <div class="desc">Show/hide and adjust opacity</div>
            </div>
            <div class="mf-sp-toggle" id="mf-toggle-status"><div class="dot"></div></div>
          </div>
          <input id="mf-slider-status" class="mf-sp-slider" type="range" min="0" max="100" value="100" />
        </div>
        <div class="mf-sp-section">
          <div class="mf-sp-row" style="margin-bottom:10px;">
            <div class="mf-sp-label">
              <div class="title">Browser Navigation</div>
              <div class="desc">Show/hide and adjust opacity</div>
            </div>
            <div class="mf-sp-toggle" id="mf-toggle-browsernav"><div class="dot"></div></div>
          </div>
          <input id="mf-slider-browsernav" class="mf-sp-slider" type="range" min="0" max="100" value="100" />
        </div>
        <div class="mf-sp-section">
          <div class="mf-sp-row" style="margin-bottom:2px;">
            <div class="mf-sp-label">
              <div class="title">Site Scrollbar</div>
              <div class="desc">Enable or disable page scrolling inside device</div>
            </div>
            <div class="mf-sp-toggle" id="mf-toggle-scrollbar"><div class="dot"></div></div>
          </div>
        </div>
      </div>
    </div>
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
      injectBrowserNavigationBar();
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
            // Improve quality and avoid edge artifacts
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.clearRect(0, 0, cw, ch);

            // Draw only the screen area (cropped from the full tab image)
            const sxScreen = Math.round(screenRect.left * dpr);
            const syScreen = Math.round(screenRect.top * dpr);
            const sw = Math.round(screenRect.width * dpr);
            const sh = Math.round(screenRect.height * dpr);
            // Inset the destination by 1 device pixel to avoid tiny white corners
            const inset = Math.max(1, Math.round(1.6 * dpr));
            const dx = Math.round((screenRect.left - frameRect.left) * dpr) + inset;
            const dy = Math.round((screenRect.top - frameRect.top) * dpr) + inset;
            const dw = Math.max(0, sw - inset * 2);
            const dh = Math.max(0, sh - inset * 2);
            ctx.drawImage(
              fullTabImg,
              sxScreen,
              syScreen,
              sw,
              sh,
              dx,
              dy,
              dw,
              dh
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

              // Show the screenshot download modal directly
              showScreenshotDownloadModal(blob);
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

    // Prevent clicking if button is disabled
    if (recordBtn.disabled) {
      return;
    }

    const isCurrentlyRecording = recordBtn.classList.contains("recording");

    if (isCurrentlyRecording) {
      console.log("Stopping recording...");
      stopRecording();
      recordBtn.classList.remove("recording");
      recordBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`;
      recordBtn.title = "Record";
      showRecordingStatus(
        "Recording completed! A download modal will appear shortly.",
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

      // Start offscreen recording (button remains enabled so user can stop it)
      startOffscreenRecording(mockupBounds);
    }
  };

  

  // Settings button and panel logic
  const settingsBtn = document.getElementById("mf-btn-settings");
  const settingsPanel = document.getElementById("mf-settings-panel");
  const settingsClose = document.getElementById("mf-sp-close");
  const statusToggle = document.getElementById("mf-toggle-status");
  const statusSlider = document.getElementById("mf-slider-status");
  const browserToggle = document.getElementById("mf-toggle-browsernav");
  const browserSlider = document.getElementById("mf-slider-browsernav");
  const scrollbarToggle = document.getElementById("mf-toggle-scrollbar");

  function syncSettingsPanelState() {
    const frame = document.getElementById("__mf_simulator_frame__");
    const platform = frame?.getAttribute("data-platform") || "iOS";
    const sb = document.getElementById("__mf_status_bar__");
    const nb = document.getElementById("__mf_browser_nav_bar__");

    // Status bar availability
    const statusVisible = !!(sb && sb.style.display !== "none" && platform !== "macOS");
    if (statusVisible) statusToggle.classList.add("active"); else statusToggle.classList.remove("active");
    if (sb && sb.style.opacity) {
      const v = Math.round(parseFloat(sb.style.opacity || "1") * 100);
      statusSlider.value = String(isNaN(v) ? 100 : v);
    } else {
      statusSlider.value = "100";
    }
    // Disable status controls on macOS
    const statusDisabled = platform === "macOS";
    statusToggle.style.opacity = statusDisabled ? "0.5" : "1";
    statusToggle.style.pointerEvents = statusDisabled ? "none" : "auto";
    statusSlider.disabled = statusDisabled;

    // Browser nav
    const navVisible = !!(nb && nb.style.display !== "none");
    if (navVisible) browserToggle.classList.add("active"); else browserToggle.classList.remove("active");
    if (nb && nb.style.opacity) {
      const v2 = Math.round(parseFloat(nb.style.opacity || "1") * 100);
      browserSlider.value = String(isNaN(v2) ? 100 : v2);
    } else {
      browserSlider.value = "100";
    }

    // Disable browser navigation controls on macOS
    const browserDisabled = platform === "macOS";
    if (browserToggle) {
      browserToggle.style.opacity = browserDisabled ? "0.5" : "1";
      browserToggle.style.pointerEvents = browserDisabled ? "none" : "auto";
    }
    if (browserSlider) browserSlider.disabled = browserDisabled;

    // Scrollbar UI visibility (default hidden). We use iframe data attribute for truth.
    let scrollbarVisible = false;
    try {
      const iframe = document.querySelector("#__mf_simulator_screen__ iframe");
      const attr = iframe?.getAttribute("data-scroll-enabled");
      if (attr === "true") scrollbarVisible = true;
      if (attr === "false") scrollbarVisible = false;
    } catch (_) {}
    if (scrollbarVisible) scrollbarToggle?.classList.add("active"); else scrollbarToggle?.classList.remove("active");
  }

  function showSettings() {
    syncSettingsPanelState();
    settingsPanel.style.display = "block";
  }
  function hideSettings() { settingsPanel.style.display = "none"; }

  if (settingsBtn) settingsBtn.onclick = () => {
    if (!settingsPanel) return;
    if (settingsPanel.style.display === "block") hideSettings(); else showSettings();
  };
  if (settingsClose) settingsClose.onclick = () => hideSettings();

  // Toggle handlers
  if (statusToggle) statusToggle.onclick = () => {
    const frame = document.getElementById("__mf_simulator_frame__");
    const platform = frame?.getAttribute("data-platform") || "iOS";
    if (platform === "macOS") return; // no-op
    let sb = document.getElementById("__mf_status_bar__");
    if (!sb) ensureStatusBar();
    sb = document.getElementById("__mf_status_bar__");
    if (!sb) return;
    const isVisible = sb.style.display !== "none";
    if (isVisible) {
      sb.style.display = "none";
      statusToggle.classList.remove("active");
      const button = document.getElementById("mf-btn-status-bar");
      if (button) button.classList.remove("selected");
    } else {
      sb.style.display = "flex";
      statusToggle.classList.add("active");
      const button = document.getElementById("mf-btn-status-bar");
      if (button) button.classList.add("selected");
    }
    adjustIframeForBars();
  };

  if (browserToggle) browserToggle.onclick = () => {
    const nb = document.getElementById("__mf_browser_nav_bar__");
    const button = document.getElementById("mf-btn-browser-nav");
    if (!nb) return;
    const isVisible = nb.style.display !== "none";
    if (isVisible) {
      nb.style.display = "none";
      browserToggle.classList.remove("active");
      if (button) button.classList.remove("selected");
    } else {
      nb.style.display = "block";
      nb.setAttribute("data-auto-hidden", "false");
      nb.style.transform = "translateY(0)";
      nb.style.opacity = "1";
      browserToggle.classList.add("active");
      if (button) button.classList.add("selected");
    }
    adjustIframeForBars();
  };

  if (statusSlider) statusSlider.oninput = (e) => {
    const sb = document.getElementById("__mf_status_bar__");
    if (!sb) return;
    const val = parseInt(e.target.value, 10);
    sb.style.opacity = String(Math.max(0, Math.min(100, val)) / 100);
  };
  if (browserSlider) browserSlider.oninput = (e) => {
    const nb = document.getElementById("__mf_browser_nav_bar__");
    if (!nb) return;
    const val = parseInt(e.target.value, 10);
    nb.style.opacity = String(Math.max(0, Math.min(100, val)) / 100);
  };

  // Scrollbar toggle handler
  function setScrollbarEnabled(enabled) {
    try {
      const iframe = document.querySelector("#__mf_simulator_screen__ iframe");
      if (!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      // Manage a dedicated style tag for scrollbar policy
      let styleEl = doc.getElementById("__mf_iframe_scrollbar_style__");
      if (!styleEl) {
        styleEl = doc.createElement("style");
        styleEl.id = "__mf_iframe_scrollbar_style__";
        doc.head.appendChild(styleEl);
      }
      if (enabled) {
        styleEl.textContent = `
          /* Ensure scrolling is enabled */
          html, body {
            overflow: auto !important;
            overscroll-behavior: auto !important;
            -ms-overflow-style: auto !important; /* IE/Edge */
            scrollbar-width: auto !important;     /* Firefox */
            scrollbar-color: #666 transparent !important; /* Firefox colors */
          }
          /* Force show scrollbar UI (WebKit/Blink) */
          ::-webkit-scrollbar {
            width: 12px !important;
            height: 12px !important;
            display: block !important;
            background: transparent !important;
          }
          ::-webkit-scrollbar-track {
            display: block !important;
            background: rgba(0,0,0,0.08) !important;
          }
          ::-webkit-scrollbar-thumb {
            display: block !important;
            background-color: rgba(0,0,0,0.35) !important;
            border-radius: 10px !important;
            border: 2px solid transparent !important;
            background-clip: content-box !important;
          }
          ::-webkit-scrollbar-corner { display: block !important; background: transparent !important; }
          ::-webkit-scrollbar-button { display: none !important; }
        `;
        iframe.setAttribute("data-scroll-enabled", "true");
      } else {
        styleEl.textContent = `
          /* hide scrollbar UI but keep scrolling */
          html, body { overflow: auto !important; overscroll-behavior: auto !important; }
          ::-webkit-scrollbar { display: none !important; width:0 !important; height:0 !important; }
          ::-webkit-scrollbar-track, ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-corner, ::-webkit-scrollbar-button { display:none !important; }
        `;
        iframe.setAttribute("data-scroll-enabled", "false");
      }
    } catch (_) {}
  }
  if (scrollbarToggle) scrollbarToggle.onclick = () => {
    const isActive = scrollbarToggle.classList.contains("active");
    const next = !isActive; // true = show scrollbar UI; false = hide UI but scrollable
    if (next) scrollbarToggle.classList.add("active"); else scrollbarToggle.classList.remove("active");
    setScrollbarEnabled(next);
  };

  // Set default: disable iframe scrolling
  setTimeout(() => {
    try {
      const iframe = document.querySelector("#__mf_simulator_screen__ iframe");
      const current = iframe?.getAttribute("data-scroll-enabled");
      if (current == null) {
        setScrollbarEnabled(false);
        if (scrollbarToggle) scrollbarToggle.classList.remove("active");
      }
    } catch (_) {}
  }, 300);

  // Update orientation indicator after toolbar is created
  updateToolbarOrientation();

  // Set initial state of browser navigation toggle button
  setTimeout(() => {
    const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
    const button = document.getElementById("mf-btn-browser-nav");
    const statusBarBtn = document.getElementById("mf-btn-status-bar");
    if (browserNavBar && button) {
      if (currentOrientation === "landscape") {
        button.classList.remove("selected");
      } else {
        button.classList.add("selected");
      }
    }
    // Initialize status bar button state
    const statusBar = document.getElementById("__mf_status_bar__");
    if (statusBarBtn) {
      if (statusBar && statusBar.style.display !== "none") {
        statusBarBtn.classList.add("selected");
      } else {
        statusBarBtn.classList.remove("selected");
      }
    }
    // After everything mounts, ensure status bar layout is applied
    adjustIframeForBars();
    // Sync settings panel with current state
    try { syncSettingsPanelState(); } catch (_) {}
  }, 100);
}

// Attach scroll listeners to auto-hide/show browser nav bar depending on iframe scroll position
function attachBrowserNavAutoHide() {
  try {
    const iframe = document.querySelector("#__mf_simulator_screen__ iframe");
    const browserNavBar = document.getElementById("__mf_browser_nav_bar__");
    if (!iframe || !browserNavBar) return;

    // Access the iframe's contentWindow for scroll events
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument || win?.document;
    if (!win || !doc) return;

    // Debounced handler for scroll position
    let lastState = null; // null | "top" | "scrolled"
    const onScroll = () => {
      // If nav is manually hidden, do nothing
      if (browserNavBar.style.display === "none") return;

      const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
      const atTop = scrollTop <= 0;

      if (atTop && lastState !== "top") {
        browserNavBar.setAttribute("data-auto-hidden", "false");
        adjustIframeForBars();
        lastState = "top";
      } else if (!atTop && lastState !== "scrolled") {
        browserNavBar.setAttribute("data-auto-hidden", "true");
        adjustIframeForBars();
        lastState = "scrolled";
      }
    };

    // Attach listeners once
    if (!browserNavBar.__autoHideHooked) {
      win.addEventListener("scroll", onScroll, { passive: true });
      // Also run on load and on resize (content changes)
      win.addEventListener("load", onScroll, { passive: true });
      win.addEventListener("resize", onScroll, { passive: true });
      browserNavBar.__autoHideHooked = true;
    }

    // Initialize state based on current scroll
    onScroll();
  } catch (_) {}
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
      statusBar.style.background =
        platform === "iOS"
          ? "linear-gradient(180deg, rgb(242, 242, 247) 0%, rgb(229, 229, 234) 100%)"
          : "#ffffff";
      statusBar.style.borderBottom =
        platform === "iOS"
          ? "0.5px solid rgba(0,0,0,0.15)"
          : "1px solid rgba(0,0,0,0.08)";

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
      signal.innerHTML =
        '<svg data-v-1bbbc0b8="" height="12" viewBox="0 0 13 8" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-1bbbc0b8="" d="M0.502889 7.99997H1.6763C1.97687 7.99997 2.17918 7.7861 2.17918 7.46818V5.41038C2.17918 5.09246 1.97687 4.88436 1.6763 4.88436H0.502889C0.202307 4.88436 -4.76837e-06 5.09246 -4.76837e-06 5.41038V7.46818C-4.76837e-06 7.7861 0.202307 7.99997 0.502889 7.99997ZM3.93064 7.99997H5.09826C5.39884 7.99997 5.60693 7.7861 5.60693 7.46818V3.98263C5.60693 3.67049 5.39884 3.45084 5.09826 3.45084H3.93064C3.63005 3.45084 3.42196 3.67049 3.42196 3.98263V7.46818C3.42196 7.7861 3.63005 7.99997 3.93064 7.99997ZM7.35259 7.99997H8.52023C8.8208 7.99997 9.0289 7.7861 9.0289 7.46818V2.33523C9.0289 2.01731 8.8208 1.80344 8.52023 1.80344H7.35259C7.05201 1.80344 6.84392 2.01731 6.84392 2.33523V7.46818C6.84392 7.7861 7.05201 7.99997 7.35259 7.99997ZM10.7745 7.99997H11.9537C12.2543 7.99997 12.4508 7.7861 12.4508 7.46818V0.531763C12.4508 0.21385 12.2543 -3.05176e-05 11.9537 -3.05176e-05H10.7745C10.474 -3.05176e-05 10.2717 0.21385 10.2717 0.531763V7.46818C10.2717 7.7861 10.474 7.99997 10.7745 7.99997Z" fill-opacity="0.9"></path></svg>';

      // WiFi icon
      const wifi = document.createElement("div");
      wifi.innerHTML =
        '<svg data-v-1bbbc0b8="" height="12" viewBox="0 0 12 8" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-1bbbc0b8="" d="M0.749444 3.40244C0.840905 3.49999 0.987249 3.49999 1.0848 3.39633C2.26164 2.14634 3.80432 1.4939 5.52994 1.4939C7.26774 1.4939 8.81652 2.15244 9.99334 3.40244C10.0787 3.4939 10.219 3.48781 10.3165 3.39024L10.9994 2.71341C11.0848 2.62195 11.0787 2.5122 11.0116 2.42683C9.88969 1.03659 7.77383 -2.38419e-07 5.52994 -2.38419e-07C3.29212 -2.38419e-07 1.17628 1.03659 0.0482247 2.42683C-0.0188486 2.5122 -0.0188485 2.62195 0.0665169 2.71341L0.749444 3.40244Z" fill-opacity="0.9"></path><path data-v-1bbbc0b8="" d="M2.73115 5.39635C2.83481 5.5061 2.97506 5.48781 3.07871 5.37805C3.63969 4.74391 4.56652 4.28049 5.52994 4.28658C6.50555 4.28049 7.42628 4.76219 8.00555 5.39635C8.09701 5.5 8.22506 5.4939 8.33482 5.39024L9.09701 4.64025C9.17628 4.56097 9.18238 4.44513 9.11531 4.35366C8.3836 3.46952 7.04824 2.78658 5.52994 2.78658C4.01165 2.78658 2.67628 3.46952 1.95066 4.35366C1.8775 4.44513 1.8775 4.54879 1.96896 4.64025L2.73115 5.39635Z" fill-opacity="0.9"></path><path data-v-1bbbc0b8="" d="M5.52995 8C5.64579 8 5.73726 7.95122 5.93238 7.7622L7.1092 6.63415C7.18238 6.56097 7.20068 6.43903 7.13361 6.35366C6.81043 5.93903 6.21896 5.57927 5.52995 5.57927C4.81653 5.57927 4.22506 5.95732 3.90799 6.39024C3.8592 6.46342 3.8836 6.56097 3.96286 6.63415L5.1275 7.7622C5.32262 7.94512 5.42018 8 5.52995 8Z" fill-opacity="0.9"></path></svg>';

      // Battery icon
      const battery = document.createElement("div");
      battery.innerHTML =
        '<svg data-v-1bbbc0b8="" height="12" viewBox="0 0 17 8" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-1bbbc0b8="" d="M12.2637 0C13.2122 0 14.0878 0.0810872 14.7129 0.706055C15.3301 1.32366 15.4033 2.19868 15.4033 3.13965V4.86035C15.4033 5.80118 15.33 6.67591 14.7129 7.30078C14.0878 7.9184 13.2122 8 12.2637 8H3.13965C2.19117 8 1.31637 7.9184 0.691406 7.30078C0.0738704 6.67589 1.6728e-05 5.80135 0 4.86035V3.13965C0 2.19852 0.0737872 1.32367 0.691406 0.706055C1.31637 0.0811107 2.19854 0 3.13965 0H12.2637ZM2.85156 0.868164C2.2915 0.868164 1.6399 0.93144 1.28418 1.30176C0.92867 1.68001 0.868164 2.34187 0.868164 2.9248V5.10742C0.868171 5.6825 0.92862 6.35231 1.28418 6.72266C1.6399 7.09297 2.29125 7.16406 2.84375 7.16406H12.5693C13.1218 7.16406 13.7732 7.09297 14.1289 6.72266C14.4845 6.35231 14.5449 5.6825 14.5449 5.10742V2.9248C14.5449 2.34187 14.4844 1.68001 14.1289 1.30176C13.7732 0.931444 13.1218 0.868165 12.5693 0.868164H2.85156Z" fill-opacity="0.3"></path><path data-v-1bbbc0b8="" d="M15.8472 5.54381C16.3177 5.5144 16.9502 4.9115 16.9502 3.99978C16.9502 3.08806 16.3177 2.48516 15.8472 2.45575V5.54381Z" fill-opacity="0.3"></path><rect data-v-1bbbc0b8="" x="1.3" y="1.3" width="12.81" height="5.43" rx="1.1" fill-opacity="0.9" fill=""></rect></svg>';

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
      statusBar.style.background =
        platform === "iOS"
          ? "linear-gradient(180deg, rgb(242, 242, 247) 0%, rgb(229, 229, 234) 100%)"
          : "#ffffff";
      statusBar.style.borderBottom =
        platform === "iOS"
          ? "0.5px solid rgba(0,0,0,0.15)"
          : "1px solid rgba(0,0,0,0.08)";
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
  const sbh = statusBar
    ? Math.ceil(statusBar.getBoundingClientRect().height)
    : 0;
  const navVisible = browserNavBar && browserNavBar.style.display !== "none";
  const mockupContainer = document.querySelector("#__mf_simulator_frame__");
  const platform = mockupContainer?.getAttribute("data-platform") || "iOS";
  // Ensure Android nav bar sits below status bar
  if (browserNavBar && platform !== "iOS") {
    browserNavBar.style.top = sbh + "px";
  }
  // If auto-hidden, do not reserve space for the nav bar
  let navBarHeight = 0;
  if (navVisible) {
    const autoHidden =
      browserNavBar.getAttribute("data-auto-hidden") === "true";
    navBarHeight = autoHidden ? 0 : platform === "iOS" ? 44 : 56;
  }
  if (platform === "iOS") {
    // Status bar at top, browser nav at bottom
    iframe.style.top = sbh + "px";
    iframe.style.height = `calc(100% - ${sbh + navBarHeight}px)`;
  } else {
    // Status bar + browser nav both eat top space on Android (nav at top)
    iframe.style.top = sbh + navBarHeight + "px";
    iframe.style.height = `calc(100% - ${sbh + navBarHeight}px)`;
  }

  // Update slide transform based on auto-hide state and platform
  if (browserNavBar && navVisible) {
    const autoHidden = browserNavBar.getAttribute("data-auto-hidden") === "true";
    if (autoHidden) {
      if (platform === "iOS") {
        // slide down out of view from bottom
        browserNavBar.style.transform = "translateY(100%)";
      } else {
        // slide up out of view from top
        browserNavBar.style.transform = "translateY(-100%)";
      }
      browserNavBar.style.opacity = "0";
    } else {
      browserNavBar.style.transform = "translateY(0)";
      browserNavBar.style.opacity = "1";
    }
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

        // Add red border to tab when recording starts
        // Method 1: Try document element border
        document.documentElement.style.border = "10px solid #ff0000";
        document.documentElement.style.boxSizing = "border-box";

        // Method 2: Create a visible red border overlay with highest z-index
        const recordingBorder = document.createElement("div");
        recordingBorder.id = "recording-border-overlay";
        recordingBorder.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          border: 10px solid #ff0000 !important;
          pointer-events: none !important;
          z-index: 2147483647 !important;
          box-sizing: border-box !important;
        `;
        document.body.appendChild(recordingBorder);

        // Note: We're not adding border to body to avoid double borders
      } else {
        console.error("Failed to start offscreen recording:", response?.error);
        showRecordingStatus(
          "Failed to start recording: " + (response?.error || "unknown error"),
          "error"
        );

        // Reset button state on failure and re-enable it
        const recordBtn = document.getElementById("mf-btn-record");
        if (recordBtn) {
          recordBtn.classList.remove("recording");
          recordBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`;
          recordBtn.title = "Record";
        }

        // Remove red border if recording failed to start
        document.documentElement.style.border = "none";

        // Remove the border overlay element if it exists
        const recordingBorder = document.getElementById(
          "recording-border-overlay"
        );
        if (recordingBorder) {
          recordingBorder.remove();
        }

        // Remove ultra border if it exists
        const ultraBorder = document.getElementById("ultra-recording-border");
        if (ultraBorder) {
          ultraBorder.remove();
        }

        enableRecordButton(); // Re-enable button on failure
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

      // Remove red border when recording stops
      document.documentElement.style.border = "none";

      // Remove the border overlay element
      const recordingBorder = document.getElementById(
        "recording-border-overlay"
      );
      if (recordingBorder) {
        recordingBorder.remove();
      }

      // Remove ultra border element
      const ultraBorder = document.getElementById("ultra-recording-border");
      if (ultraBorder) {
        ultraBorder.remove();
      }

      // Disable record button after stopping to prevent new recordings
      disableRecordButton();

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

      // Remove red border if stopping failed
      document.documentElement.style.border = "none";

      // Remove the border overlay element if it exists
      const recordingBorder = document.getElementById(
        "recording-border-overlay"
      );
      if (recordingBorder) {
        recordingBorder.remove();
      }

      // Remove ultra border if it exists
      const ultraBorder = document.getElementById("ultra-recording-border");
      if (ultraBorder) {
        ultraBorder.remove();
      }

      // Re-enable button if stopping failed
      enableRecordButton();
    }
  });
}

function checkVideoCompletion() {
  // Check recording status from background script
  chrome.runtime.sendMessage({ type: "GET_RECORDING_STATUS" }, (response) => {
    if (response && response.isRecording === false && response.videoBlobData) {
      // Video is ready, show download option
      showDownloadModal(response.videoBlobData);
      // Record button is currently disabled and will be enabled when modal is closed
    } else if (response && response.isRecording === false) {
      // Recording stopped but no video yet, wait a bit more
      setTimeout(checkVideoCompletion, 500);
    } else {
      // Still recording or error
      showRecordingStatus(
        "Video processing complete! A download modal will appear shortly.",
        "success"
      );
    }
  });
}

// Function to disable record button
function disableRecordButton() {
  const recordBtn = document.getElementById("mf-btn-record");
  if (recordBtn) {
    recordBtn.disabled = true;
    recordBtn.style.opacity = "0.5";
    recordBtn.style.cursor = "not-allowed";
    recordBtn.title = "Please wait for current recording to finish...";

    // Add visual feedback that button is disabled
    recordBtn.style.filter = "grayscale(50%)";
    recordBtn.style.transform = "scale(0.95)";
  }
}

// Function to enable record button
function enableRecordButton() {
  const recordBtn = document.getElementById("mf-btn-record");
  if (recordBtn) {
    recordBtn.disabled = false;
    recordBtn.style.opacity = "1";
    recordBtn.style.cursor = "pointer";
    recordBtn.title = "Record";

    // Restore visual state
    recordBtn.style.filter = "none";
    recordBtn.style.transform = "scale(1)";
  }
}

// Function to show screenshot download modal
function showScreenshotDownloadModal(blob) {
  // Create modal overlay
  const modalOverlay = document.createElement("div");
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;

  // Add success icon
  const successIcon = document.createElement("div");
  successIcon.innerHTML = `
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `;
  successIcon.style.marginBottom = "20px";
  modalContent.appendChild(successIcon);

  // Add title
  const title = document.createElement("h2");
  title.textContent = "Screenshot Ready!";
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
  `;
  modalContent.appendChild(title);

  // Add description
  const description = document.createElement("p");
  description.textContent = "Your screenshot is ready for download.";
  description.style.cssText = `
    margin: 0 0 15px 0;
    color: #666;
    font-size: 16px;
    line-height: 1.5;
  `;
  modalContent.appendChild(description);

  // Add file info
  const fileInfo = document.createElement("div");
  fileInfo.style.cssText = `
    margin: 0 0 25px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    text-align: left;
  `;

  const fileSize = Math.round(blob.size / 1024); // Convert to KB
  fileInfo.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: 600; color: #333;">File Information:</div>
    <div style="color: #666; font-size: 14px;">
      <div>Type: PNG Image</div>
      <div>Size: ${fileSize} KB</div>
      <div>Format: Portable Network Graphics</div>
    </div>
  `;
  modalContent.appendChild(fileInfo);

  // Add preview (for screenshots)
  const previewContainer = document.createElement("div");
  previewContainer.style.cssText = `
    margin: 0 0 25px 0;
    text-align: center;
  `;

  const preview = document.createElement("img");
  preview.src = URL.createObjectURL(blob);
  preview.style.cssText = `
    max-width: 200px;
    max-height: 150px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  previewContainer.appendChild(preview);
  modalContent.appendChild(previewContainer);

  // Add download button
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download Screenshot";
  downloadBtn.style.cssText = `
    background: #2196F3;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin: 0 10px 10px 0;
    transition: all 0.2s ease;
  `;

  downloadBtn.onmouseenter = () => {
    downloadBtn.style.background = "#1976D2";
    downloadBtn.style.transform = "translateY(-1px)";
  };

  downloadBtn.onmouseleave = () => {
    downloadBtn.style.background = "#2196F3";
    downloadBtn.style.transform = "translateY(0)";
  };

  downloadBtn.onclick = () => {
    // Create download link
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `mockup-screenshot-${Date.now()}.png`;

    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 5000);

    // Close modal
    modalOverlay.remove();
  };

  modalContent.appendChild(downloadBtn);

  // Add copy button
  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy to Clipboard";
  copyBtn.style.cssText = `
    background: #34C759;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin: 0 10px 10px 0;
    transition: all 0.2s ease;
  `;

  copyBtn.onmouseenter = () => {
    copyBtn.style.background = "#2FB750";
    copyBtn.style.transform = "translateY(-1px)";
  };

  copyBtn.onmouseleave = () => {
    copyBtn.style.background = "#34C759";
    copyBtn.style.transform = "translateY(0)";
  };

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy to Clipboard";
      }, 2000);
    } catch (err) {
      console.error("Copy failed", err);
      copyBtn.textContent = "Failed";
      setTimeout(() => {
        copyBtn.textContent = "Copy to Clipboard";
      }, 2000);
    }
  };

  modalContent.appendChild(copyBtn);

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = `
    background: #f5f5f5;
    color: #666;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "#e0e0e0";
  };

  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "#f5f5f5";
  };

  closeBtn.onclick = () => {
    modalOverlay.remove();
  };

  modalContent.appendChild(closeBtn);

  // Add modal to page
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Close modal on overlay click
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  };
}

// Function to show download modal
function showDownloadModal(videoBlobData) {
  // Create modal overlay
  const modalOverlay = document.createElement("div");
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 800px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    gap: 30px;
    align-items: flex-start;
  `;

  // Create left column for video preview
  const leftColumn = document.createElement("div");
  leftColumn.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  `;

  // Create right column for details and actions
  const rightColumn = document.createElement("div");
  rightColumn.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  `;

  // Add success icon to right column
  const successIcon = document.createElement("div");
  successIcon.innerHTML = `
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `;
  successIcon.style.marginBottom = "20px";
  rightColumn.appendChild(successIcon);

  // Add title to right column
  const title = document.createElement("h2");
  title.textContent = "Recording Complete!";
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
  `;
  rightColumn.appendChild(title);

  // Add description to right column
  const description = document.createElement("p");
  description.textContent = "Your screen recording is ready for download.";
  description.style.cssText = `
    margin: 0 0 15px 0;
    color: #666;
    font-size: 16px;
    line-height: 1.5;
  `;
  rightColumn.appendChild(description);

  // Add file info to right column
  const fileInfo = document.createElement("div");
  fileInfo.style.cssText = `
    margin: 0 0 25px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    text-align: left;
  `;

  // Calculate file size from base64 data
  const fileSize = Math.round((videoBlobData.base64Data.length * 3) / 4 / 1024); // Approximate size in KB
  const fileType = videoBlobData.type || "video/webm";
  const fileExtension = fileType.split("/")[1] || "webm";

  fileInfo.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: 600; color: #333;">File Information:</div>
    <div style="color: #666; font-size: 14px;">
      <div>Type: Video</div>
      <div>Size: ~${fileSize} KB</div>
      <div>Format: webm</div>
    </div>
  `;
  rightColumn.appendChild(fileInfo);

  // Add video preview to left column
  const previewContainer = document.createElement("div");
  previewContainer.style.cssText = `
    text-align: center;
    position: relative;
    margin-bottom: 20px;
  `;

  const videoPreview = document.createElement("video");
  videoPreview.style.cssText = `
    
    height: 400px;
   
   
    background: #000;
    cursor: pointer;
    object-fit: cover;
  `;

  // Set video attributes for looping
  videoPreview.loop = true;
  videoPreview.muted = true;
  videoPreview.controls = false;
  videoPreview.autoplay = true;
  videoPreview.playsInline = true;

  // Create video blob and set source
  const binaryString = atob(videoBlobData.base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const videoBlob = new Blob([bytes], {
    type: videoBlobData.type || "video/webm",
  });

  const videoUrl = URL.createObjectURL(videoBlob);
  videoPreview.src = videoUrl;

  // Clean up the preview URL when modal is closed
  const cleanupPreview = () => {
    URL.revokeObjectURL(videoUrl);
  };

  // Add play/pause overlay indicator
  const playPauseOverlay = document.createElement("div");
  playPauseOverlay.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
  `;

  // Add play/pause icon
  const playIcon = document.createElement("div");
  playIcon.innerHTML = "▶";
  playPauseOverlay.appendChild(playIcon);

  // Show overlay on hover
  videoPreview.addEventListener("mouseenter", () => {
    playPauseOverlay.style.opacity = "1";
  });

  videoPreview.addEventListener("mouseleave", () => {
    playPauseOverlay.style.opacity = "0";
  });

  // Toggle play/pause on click
  videoPreview.addEventListener("click", () => {
    if (videoPreview.paused) {
      videoPreview.play();
      playIcon.innerHTML = "⏸";
    } else {
      videoPreview.pause();
      playIcon.innerHTML = "▶";
    }
  });

  // Update overlay icon based on video state
  videoPreview.addEventListener("play", () => {
    playIcon.innerHTML = "⏸";
  });

  videoPreview.addEventListener("pause", () => {
    playIcon.innerHTML = "▶";
  });

  // Add event listeners for cleanup
  videoPreview.addEventListener("loadeddata", () => {
    // Video is ready to play
    videoPreview.play().catch((e) => console.log("Autoplay prevented:", e));
  });

  videoPreview.addEventListener("error", (e) => {
    console.error("Video preview error:", e);
    previewContainer.innerHTML = `
      <div style="
        width: 350px; 
        height: 250px; 
        background: #f8f9fa; 
        border: 1px solid #e9ecef; 
        border-radius: 12px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: #666;
        font-size: 14px;
      ">
        <div>Video preview unavailable</div>
      </div>
    `;
  });

  previewContainer.appendChild(videoPreview);
  previewContainer.appendChild(playPauseOverlay);

  // Add preview label
  const previewLabel = document.createElement("div");
  previewLabel.textContent = "Click to play/pause • Looping preview";
  previewLabel.style.cssText = `
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    font-style: italic;
  `;
  previewContainer.appendChild(previewLabel);

  // Add preview to left column
  leftColumn.appendChild(previewContainer);

  // Add download button
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download Video";
  downloadBtn.style.cssText = `
    background: #2196F3;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin: 0 10px 10px 0;
    transition: all 0.2s ease;
  `;

  downloadBtn.onmouseenter = () => {
    downloadBtn.style.background = "#1976D2";
    downloadBtn.style.transform = "translateY(-1px)";
  };

  downloadBtn.onmouseleave = () => {
    downloadBtn.style.background = "#2196F3";
    downloadBtn.style.transform = "translateY(0)";
  };

  downloadBtn.onclick = () => {
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

    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 5000);

    // Close modal and enable record button
    cleanupPreview(); // Clean up video preview URL
    modalOverlay.remove();
    enableRecordButton();
    showRecordingStatus("Download started!", "success");
  };

  rightColumn.appendChild(downloadBtn);

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = `
    background: #f5f5f5;
    color: #666;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "#e0e0e0";
  };

  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "#f5f5f5";
  };

  closeBtn.onclick = () => {
    cleanupPreview(); // Clean up video preview URL
    modalOverlay.remove();
    enableRecordButton();
  };

  rightColumn.appendChild(closeBtn);

  // Add both columns to modal content
  modalContent.appendChild(leftColumn);
  modalContent.appendChild(rightColumn);

  // Add modal to page
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Close modal on overlay click
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      cleanupPreview(); // Clean up video preview URL
      modalOverlay.remove();
      enableRecordButton();
    }
  };
}

function injectBrowserNavigationBar() {
  const frame = document.getElementById("__mf_simulator_frame__");
  const screen = document.getElementById("__mf_simulator_screen__");

  if (!frame || !screen) return;

  // Remove existing navigation bar if present
  const existingNavBar = document.getElementById("__mf_browser_nav_bar__");
  if (existingNavBar) {
    existingNavBar.remove();
  }

  const browserNavBar = document.createElement("div");
  browserNavBar.id = "__mf_browser_nav_bar__";
  const platform = frame.getAttribute("data-platform") || "iOS";

  // Do not render browser navigation on macOS devices
  if (platform === "macOS") {
    // Ensure layout updates if an existing bar was removed
    try { adjustIframeForBars(); } catch (_) {}
    return;
  }

  browserNavBar.style.position = "absolute";
  browserNavBar.style.left = "0";
  browserNavBar.style.right = "0";
  browserNavBar.style.zIndex = "10";
  browserNavBar.style.pointerEvents = "none";
  // Enable smooth slide animations for auto-hide/show
  browserNavBar.style.transition = "transform 200ms ease, opacity 200ms ease";
  browserNavBar.setAttribute("data-auto-hidden", "false");

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
            <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"6\" y=\"10\" width=\"12\" height=\"10\" rx=\"2\"/><path d=\"M9 10V7a3 3 0 0 1 6 0v3\"/></svg>
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

    // Add event listeners for iOS navigation
    const _b = browserNavBar.querySelector("#__mf_nav_back__");
    if (_b) _b.onclick = () => history.back();
    const _f = browserNavBar.querySelector("#__mf_nav_forward__");
    if (_f) _f.onclick = () => history.forward();
    const _r = browserNavBar.querySelector("#__mf_nav_refresh__");
    if (_r) _r.onclick = () => location.reload();
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
      <div style="display:flex;align-items:center;justify-content:center;gap:4%;margin-top:10px;pointer-events:auto;">
        <svg data-v-472967bd="" width="20" height="19" viewBox="0 0 20 19" fill="black" xmlns="http://www.w3.org/2000/svg" class="home"><path data-v-472967bd="" d="M16.1398 6.35722C15.5274 6.35722 15.0309 6.85367 15.0309 7.46607V17.5001C15.0309 18.1125 15.5274 18.6089 16.1398 18.6089C16.7522 18.6089 17.2486 18.1125 17.2486 17.5001V7.46607C17.2486 6.85367 16.7522 6.35722 16.1398 6.35722Z"></path><path data-v-472967bd="" d="M17.2487 17.5063C17.2487 16.8973 16.755 16.4036 16.146 16.4036L3.81309 16.4036C3.20411 16.4036 2.71043 16.8973 2.71043 17.5063C2.71043 18.1153 3.20411 18.6089 3.81309 18.6089H16.146C16.755 18.6089 17.2487 18.1153 17.2487 17.5063Z"></path><path data-v-472967bd="" d="M10.6215 0.454741C10.2122 0.0434338 9.54515 0.0399337 9.13156 0.446924L0.880601 8.56614C0.467008 8.97313 0.463528 9.63649 0.872829 10.0478C1.28213 10.4591 1.94922 10.4626 2.36281 10.0556L10.6138 1.9364C11.0274 1.52941 11.0308 0.866048 10.6215 0.454741Z"></path><path data-v-472967bd="" d="M3.81921 6.35722C3.20681 6.35722 2.71036 6.85367 2.71036 7.46607V17.5001C2.71036 18.1125 3.20681 18.6089 3.81921 18.6089C4.43161 18.6089 4.92806 18.1125 4.92806 17.5001V7.46607C4.92806 6.85367 4.43161 6.35722 3.81921 6.35722Z"></path><path data-v-472967bd="" d="M9.15675 0.425978C9.54745 0.0333643 10.1842 0.0300235 10.579 0.418516L18.898 8.60472C19.2928 8.99321 19.2962 9.62642 18.9055 10.019C18.5148 10.4117 17.878 10.415 17.4832 10.0265L9.16417 1.8403C8.76937 1.4518 8.76605 0.818592 9.15675 0.425978Z"></path></svg>
        <div style=\"display:flex;align-items:center;background:#f1f3f4;border-radius:10px;padding:8px 12px;border:1px solid rgba(0,0,0,0.06);pointer-events:auto;\">
          <span style=\"display:inline-flex;margin-right:8px;color:#5f6368;\">
            <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#5f6368\" stroke-width=\"2\"><rect x=\"6\" y=\"10\" width=\"12\" height=\"10\" rx=\"2\"/><path d=\"M9 10V7a3 3 0 0 1 6 0v3\"/></svg>
          </span>
          <span style=\"flex:1;color:#202124;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\">${
            window.location.hostname || "www.webmobilefirst.com"
          }</span>
        </div>
        <svg data-v-472967bd="" width="18" height="19" viewBox="0 0 18 19" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-472967bd="" d="M7.533 8.34082L9.024 7.02832V12.6983H10.536V5.26432H9.066L6.6405 7.31182L7.533 8.34082Z"></path><path data-v-472967bd="" fill-rule="evenodd" clip-rule="evenodd" d="M0 5.2123C0 2.45087 2.23858 0.212296 5 0.212296H13C15.7614 0.212296 18 2.45087 18 5.2123V13.1117C18 15.8732 15.7614 18.1117 13 18.1117H5C2.23858 18.1117 0 15.8732 0 13.1117V5.2123ZM5 2.2123H13C14.6569 2.2123 16 3.55544 16 5.2123V13.1117C16 14.7686 14.6569 16.1117 13 16.1117H5C3.34315 16.1117 2 14.7686 2 13.1117V5.2123C2 3.55544 3.34315 2.2123 5 2.2123Z"></path></svg>
        <svg data-v-472967bd="" width="4" height="17" viewBox="0 0 4 17" fill="black" xmlns="http://www.w3.org/2000/svg"><path data-v-472967bd="" d="M-0.000244141 2.1667C-0.000244141 3.24918 0.882209 4.1267 1.97077 4.1267C3.05933 4.1267 3.94178 3.24918 3.94178 2.1667C3.94178 1.08422 3.05933 0.206696 1.97077 0.206696C0.882209 0.206696 -0.000244141 1.08422 -0.000244141 2.1667Z"></path><path data-v-472967bd="" d="M-0.000244141 14.1573C-0.000244141 15.2398 0.882209 16.1173 1.97077 16.1173C3.05933 16.1173 3.94178 15.2398 3.94178 14.1573C3.94178 13.0748 3.05933 12.1973 1.97077 12.1973C0.882209 12.1973 -0.000244141 13.0748 -0.000244141 14.1573Z"></path><path data-v-472967bd="" d="M-0.000244141 8.16202C-0.000244141 9.2445 0.882209 10.122 1.97077 10.122C3.05933 10.122 3.94178 9.2445 3.94178 8.16202C3.94178 7.07954 3.05933 6.20201 1.97077 6.20201C0.882209 6.20201 -0.000244141 7.07954 -0.000244141 8.16202Z"></path></svg>
      </div>
    `;

    // Add event listener for Android menu button
    const menuBtn = browserNavBar.querySelector("#__mf_nav_menu__");
    if (menuBtn) {
      menuBtn.onclick = () => {
        // Toggle browser navigation bar visibility
        const isVisible = browserNavBar.style.display !== "none";
        if (isVisible) {
          browserNavBar.style.display = "none";
          const button = document.getElementById("mf-btn-browser-nav");
          if (button) button.classList.remove("selected");
        } else {
          browserNavBar.style.display = "block";
          const button = document.getElementById("mf-btn-browser-nav");
          if (button) button.classList.add("selected");
        }
        adjustIframeForBars();
      };
    }
  }

  screen.insertBefore(browserNavBar, screen.firstChild);
  adjustIframeForBars();
  // Attach auto-hide based on iframe scroll
  attachBrowserNavAutoHide();
}
