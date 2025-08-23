// Content script for device simulation
// This script injects a floating toolbar when the simulator is active

let toolbar = null;

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
      // Optionally update toolbar state
      break;

    case "TOGGLE_SCROLLBAR":
      // Optionally update toolbar state
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
  if (toolbar) return;

  toolbar = document.createElement("div");
  toolbar.id = "mf-toolbar";
  toolbar.innerHTML = `
    <style>
      #mf-toolbar {
        position: fixed;
        top: 60px;
        right: 24px;
        z-index: 2147483647;
        display: flex;
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
  document.body.appendChild(toolbar);

  // Button event handlers (placeholders)
  document.getElementById("mf-btn-close").onclick = () => {
    chrome.runtime.sendMessage({
      type: "DEACTIVATE_SIMULATOR_FOR_TAB",
      tabId: null,
    });
  };
  document.getElementById("mf-btn-device").onclick = () => {
    // Device mode action (placeholder)
    alert("Device mode button clicked");
  };
  document.getElementById("mf-btn-panel").onclick = () => {
    // Show device panel (placeholder)
    alert("Show device panel button clicked");
  };
  document.getElementById("mf-btn-rotate").onclick = () => {
    // Rotate action (placeholder)
    alert("Rotate button clicked");
  };
  document.getElementById("mf-btn-screenshot").onclick = () => {
    // Screenshot action (placeholder)
    alert("Screenshot button clicked");
  };
  document.getElementById("mf-btn-record").onclick = () => {
    // Record action (placeholder)
    alert("Record button clicked");
  };
}

function removeToolbar() {
  if (toolbar) {
    toolbar.remove();
    toolbar = null;
  }
}
