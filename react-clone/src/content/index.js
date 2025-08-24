// Content script for device simulation
// This script injects a floating toolbar when the simulator is active

let toolbar = null;
let deviceSelector = null;
let devicePanel = null;
let currentOrientation = "portrait"; // Track current orientation

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, device, showScrollbar, orientation } = message;

  switch (type) {
    case "SIMULATOR_ACTIVATED":
      currentOrientation = orientation || "portrait";
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

    case "ORIENTATION_CHANGED":
      currentOrientation = orientation || "portrait";
      updateToolbarOrientation();
      break;

    case "TOGGLE_SCROLLBAR":
      // Update toolbar state if needed
      break;

    case "GET_MOCKUP_BOUNDS":
      const frameEl = document.getElementById("__mf_simulator_frame__");
      const screenEl = document.getElementById("__mf_simulator_screen__");
      
      if (frameEl && screenEl) {
        const frameRect = frameEl.getBoundingClientRect();
        const screenRect = screenEl.getBoundingClientRect();
        
        sendResponse({
          frame: {
            left: frameRect.left,
            top: frameRect.top,
            width: frameRect.width,
            height: frameRect.height
          },
          screen: {
            left: screenRect.left,
            top: screenRect.top,
            width: screenRect.width,
            height: screenRect.height
          },
          orientation: currentOrientation
        });
      } else {
        sendResponse(null);
      }
      return true; // Keep message channel open for async response
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
    <button class="mf-toolbar-btn" id="mf-btn-scrollbar" title="Show Scroll Bar">
      <svg viewBox="0 0 24 24"><rect x="10" y="4" width="4" height="16" rx="2"/><rect x="4" y="10" width="16" height="4" rx="2"/></svg>
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
  
  // Initialize recording status
  initRecordingStatus();

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
    // Implement rotate functionality with visual animation (like basic_clone)
    try {
      // Get current orientation from the button indicator
      const isCurrentlyLandscape = currentOrientation === "landscape";

      // Find the mockup container and do a brief visual rotation
      const mockupContainer = document.querySelector("#__mf_simulator_frame__");
      if (mockupContainer) {
        // Brief visual rotate animation before applying new orientation
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
    console.log('Record button clicked!');
    
    // Check if simulator is active
    const frameEl = document.getElementById("__mf_simulator_frame__");
    if (!frameEl) {
      return alert("Simulator not active. Please activate the device simulator first.");
    }

    // Use the improved recording system via background script
    if (isRecording) {
      console.log('Stopping recording via background script...');
      isRecording = false; // Set state immediately for UI responsiveness
      updateRecordButton(false);
      showRecordingStatus('Stopping recording...');
      
      chrome.runtime.sendMessage({ type: "STOP_RECORDING" }, (response) => {
        if (response && response.ok) {
          console.log('Recording stopped successfully');
          showRecordingStatus('Recording stopped');
        } else {
          console.error('Failed to stop recording:', response);
          showRecordingStatus('Failed to stop recording');
          // Reset state if stop failed
          isRecording = true;
          updateRecordButton(true);
        }
      });
    } else {
      console.log('Starting recording via background script...');
      isRecording = true; // Set state immediately for UI responsiveness
      updateRecordButton(true);
      showRecordingStatus('Starting recording...');
      
      chrome.runtime.sendMessage({ type: "START_RECORDING" }, (response) => {
        if (response && response.ok) {
          console.log('Recording started successfully');
          showRecordingStatus('Recording started...');
        } else {
          console.error('Failed to start recording:', response);
          showRecordingStatus('Failed to start recording: ' + (response?.error || 'Unknown error'));
          // Reset state if start failed
          isRecording = false;
          updateRecordButton(false);
        }
      });
    }
  };

  let scrollBarVisible = false;
  const scrollBarBtn = document.getElementById("mf-btn-scrollbar");

  // Query current tab's scrollbar state on toolbar injection
  chrome.runtime.sendMessage(
    { type: "GET_TAB_STATE", tabId: null },
    (state) => {
      if (state && typeof state.showScrollbar === "boolean") {
        scrollBarVisible = state.showScrollbar;
        updateScrollBarBtn();
      }
    }
  );

  function updateScrollBarBtn() {
    if (scrollBarVisible) {
      scrollBarBtn.classList.add("selected");
      scrollBarBtn.title = "Hide Scroll Bar";
    } else {
      scrollBarBtn.classList.remove("selected");
      scrollBarBtn.title = "Show Scroll Bar";
    }
  }

  scrollBarBtn.onclick = () => {
    chrome.runtime.sendMessage(
      { type: "TOGGLE_SCROLLBAR_FOR_TAB", tabId: null },
      (response) => {
        if (response && typeof response.showScrollbar === "boolean") {
          scrollBarVisible = response.showScrollbar;
          updateScrollBarBtn();
        }
      }
    );
  };

  // Update orientation indicator after toolbar is created
  updateToolbarOrientation();
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

// Helper functions for recording
function updateRecordButton(isRecording) {
  const recordBtn = document.getElementById("mf-btn-record");
  if (recordBtn) {
    if (isRecording) {
      recordBtn.style.background = "#ff4444";
      recordBtn.title = "Stop Recording";
      recordBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      `;
    } else {
      recordBtn.style.background = "#555";
      recordBtn.title = "Start Recording";
      recordBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8"/>
        </svg>
      `;
    }
  }
}

// Improved recording system - uses background script
let isRecording = false;
let recordingStatus = null;

// Initialize recording status display
function initRecordingStatus() {
  // Add recording status display
  recordingStatus = document.createElement('div');
  recordingStatus.className = 'recording-status';
  recordingStatus.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    display: none;
  `;
  document.body.appendChild(recordingStatus);
}

function showRecordingStatus(message) {
  if (recordingStatus) {
    recordingStatus.textContent = message;
    recordingStatus.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      recordingStatus.style.display = 'none';
    }, 3000);
  }
}
