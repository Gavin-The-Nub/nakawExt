import React, { useState, useEffect } from "react";
import { DEVICES, getDeviceBySlug } from "../shared/devices";

const DevicePanelApp = () => {
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [is3DMode, setIs3DMode] = useState(false);

  useEffect(() => {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "OPEN_DEVICE_PANEL") {
        // Handle device panel opening
        console.log("Device panel opened");
      }
    });
  }, []);

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);

    // Send message to content script to change device
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.runtime.sendMessage({
          type: "SET_DEVICE_FOR_TAB",
          tabId: tabs[0].id,
          deviceSlug: device.slug,
        });
      }
    });
  };

  return (
    <div className="device-panel-app">
      <header className="panel-header">
        <h1>Device Simulator - Panel</h1>
        <div className="panel-controls">
          <button
            className={`mode-btn ${!is3DMode ? "active" : ""}`}
            onClick={() => setIs3DMode(false)}
          >
            2D View
          </button>
          <button
            className={`mode-btn ${is3DMode ? "active" : ""}`}
            onClick={() => setIs3DMode(true)}
            disabled
          >
            3D View (Coming Soon)
          </button>
        </div>
      </header>

      <div className="panel-content">
        <div className="device-list-sidebar">
          <h3>Available Devices</h3>
          <div className="device-categories">
            {Object.entries(
              DEVICES.reduce((groups, device) => {
                if (!groups[device.platform]) {
                  groups[device.platform] = [];
                }
                groups[device.platform].push(device);
                return groups;
              }, {})
            ).map(([platform, devices]) => (
              <div key={platform} className="device-category">
                <h4>{platform}</h4>
                {devices.map((device) => (
                  <button
                    key={device.slug}
                    className={`device-btn ${
                      selectedDevice.slug === device.slug ? "selected" : ""
                    }`}
                    onClick={() => handleDeviceSelect(device)}
                  >
                    <div className="device-info">
                      <div className="device-name">{device.name}</div>
                      <div className="device-resolution">
                        {device.viewport.width} × {device.viewport.height}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="device-preview-area">
          <div className="device-preview-2d">
            <div className="device-mockup-2d">
              <div
                className="device-frame"
                style={{
                  width: selectedDevice.viewport.width * 0.3,
                  height: selectedDevice.viewport.height * 0.3,
                  backgroundColor:
                    selectedDevice.platform === "iOS" ? "#000" : "#333",
                  borderRadius:
                    selectedDevice.platform === "iOS" ? "20px" : "10px",
                  position: "relative",
                  margin: "0 auto",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  className="device-screen"
                  style={{
                    width: "90%",
                    height: "85%",
                    backgroundColor: "#fff",
                    position: "absolute",
                    top: "7.5%",
                    left: "5%",
                    borderRadius:
                      selectedDevice.platform === "iOS" ? "12px" : "6px",
                  }}
                >
                  <div className="screen-content">
                    <div className="status-bar">
                      <span>9:41</span>
                      <span>100%</span>
                    </div>
                    <div className="app-content">
                      <div className="content-placeholder">
                        <div className="placeholder-line"></div>
                        <div className="placeholder-line"></div>
                        <div className="placeholder-line short"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="device-info-panel">
            <h3>{selectedDevice.name}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Platform:</label>
                <span>{selectedDevice.platform}</span>
              </div>
              <div className="info-item">
                <label>Resolution:</label>
                <span>
                  {selectedDevice.viewport.width} ×{" "}
                  {selectedDevice.viewport.height}
                </span>
              </div>
              <div className="info-item">
                <label>User Agent:</label>
                <span className="ua-text">{selectedDevice.ua}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .device-panel-app {
          width: 100vw;
          height: 100vh;
          background: #1a1a1a;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          background: #2a2a2a;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
        }

        .panel-header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .panel-controls {
          display: flex;
          gap: 8px;
        }

        .mode-btn {
          padding: 8px 16px;
          background: #333;
          border: 1px solid #555;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mode-btn.active {
          background: #667eea;
          border-color: #667eea;
        }

        .panel-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .device-list-sidebar {
          width: 300px;
          background: #2a2a2a;
          border-right: 1px solid #333;
          padding: 20px;
          overflow-y: auto;
        }

        .device-list-sidebar h3 {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .device-category {
          margin-bottom: 24px;
        }

        .device-category h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 500;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .device-btn {
          width: 100%;
          padding: 12px;
          background: #333;
          border: 1px solid #444;
          color: white;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          margin-bottom: 8px;
          transition: all 0.2s;
        }

        .device-btn:hover {
          background: #444;
          border-color: #555;
        }

        .device-btn.selected {
          background: #667eea;
          border-color: #667eea;
        }

        .device-info {
          display: flex;
          flex-direction: column;
        }

        .device-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .device-resolution {
          font-size: 12px;
          color: #ccc;
        }

        .device-preview-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 20px;
        }

        .device-preview-2d {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          border-radius: 8px;
        }

        .device-mockup-2d {
          text-align: center;
        }

        .screen-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          font-size: 8px;
          color: #333;
        }

        .status-bar {
          display: flex;
          justify-content: space-between;
          padding: 2px 4px;
          background: #f0f0f0;
          font-weight: bold;
        }

        .app-content {
          flex: 1;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content-placeholder {
          width: 100%;
        }

        .placeholder-line {
          height: 2px;
          background: #e0e0e0;
          margin: 2px 0;
          border-radius: 1px;
        }

        .placeholder-line.short {
          width: 60%;
        }

        .device-info-panel {
          margin-top: 20px;
          padding: 20px;
          background: #2a2a2a;
          border-radius: 8px;
        }

        .device-info-panel h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .info-grid {
          display: grid;
          gap: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-item label {
          font-weight: 500;
          color: #999;
        }

        .info-item span {
          color: #fff;
        }

        .ua-text {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default DevicePanelApp;
