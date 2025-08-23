import React, { useState, useEffect } from "react";
import { DEVICES, getDeviceBySlug } from "../shared/devices";
import DeviceSelector from "./DeviceSelector";
import SimulatorControls from "./SimulatorControls";
import DevicePreview from "./DevicePreview";

const PopupApp = () => {
  const [currentTab, setCurrentTab] = useState(null);
  const [tabState, setTabState] = useState({
    isActive: false,
    device: DEVICES[0],
    showScrollbar: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePopup();
  }, []);

  const initializePopup = async () => {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      setCurrentTab(tab);

      // Get current tab state
      const response = await chrome.runtime.sendMessage({
        type: "GET_TAB_STATE",
        tabId: tab.id,
      });

      if (response) {
        setTabState(response);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to initialize popup:", error);
      setLoading(false);
    }
  };

  const activateSimulator = async (deviceSlug = null) => {
    if (!currentTab) return;

    try {
      await chrome.runtime.sendMessage({
        type: "ACTIVATE_SIMULATOR_FOR_TAB",
        tabId: currentTab.id,
        deviceSlug: deviceSlug,
      });

      // Update local state
      const device = deviceSlug ? getDeviceBySlug(deviceSlug) : tabState.device;
      setTabState((prev) => ({
        ...prev,
        isActive: true,
        device: device,
      }));

      // Close popup after activation
      setTimeout(() => {
        window.close();
      }, 100);
    } catch (error) {
      console.error("Failed to activate simulator:", error);
    }
  };

  const deactivateSimulator = async () => {
    if (!currentTab) return;

    try {
      await chrome.runtime.sendMessage({
        type: "DEACTIVATE_SIMULATOR_FOR_TAB",
        tabId: currentTab.id,
      });

      setTabState((prev) => ({
        ...prev,
        isActive: false,
      }));
    } catch (error) {
      console.error("Failed to deactivate simulator:", error);
    }
  };

  const changeDevice = async (deviceSlug) => {
    if (!currentTab) return;

    try {
      await chrome.runtime.sendMessage({
        type: "SET_DEVICE_FOR_TAB",
        tabId: currentTab.id,
        deviceSlug: deviceSlug,
      });

      const device = getDeviceBySlug(deviceSlug);
      setTabState((prev) => ({
        ...prev,
        device: device,
      }));
    } catch (error) {
      console.error("Failed to change device:", error);
    }
  };

  const toggleScrollbar = async () => {
    if (!currentTab) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "TOGGLE_SCROLLBAR_FOR_TAB",
        tabId: currentTab.id,
      });

      if (response) {
        setTabState((prev) => ({
          ...prev,
          showScrollbar: response.showScrollbar,
        }));
      }
    } catch (error) {
      console.error("Failed to toggle scrollbar:", error);
    }
  };

  if (loading) {
    return (
      <div className="popup-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Check if page is compatible
  if (currentTab?.url?.startsWith("file://")) {
    return (
      <div className="popup-incompatible">
        <div className="incompatible-icon">📁</div>
        <h3>Local Files</h3>
        <p>
          Device simulator works best with web pages. Local files may have
          limited functionality.
        </p>
        <button className="btn btn-primary" onClick={() => activateSimulator()}>
          Try Anyway
        </button>
      </div>
    );
  }

  if (
    currentTab?.url?.startsWith("chrome://") ||
    currentTab?.url?.startsWith("chrome-extension://")
  ) {
    return (
      <div className="popup-incompatible">
        <div className="incompatible-icon">🔒</div>
        <h3>Chrome Pages</h3>
        <p>Device simulator cannot be used on Chrome internal pages.</p>
      </div>
    );
  }

  return (
    <div className="popup-app">
      <header className="popup-header">
        <h1>Device Simulator</h1>
        <div className="status-indicator">
          {tabState.isActive ? (
            <span className="status active">● Active</span>
          ) : (
            <span className="status inactive">○ Inactive</span>
          )}
        </div>
      </header>

      {tabState.isActive ? (
        <div className="simulator-active">
          <DevicePreview device={tabState.device} />

          <div className="current-device-info">
            <h3>{tabState.device.name}</h3>
            <p>
              {tabState.device.viewport.width} ×{" "}
              {tabState.device.viewport.height}
            </p>
            <p className="platform">{tabState.device.platform}</p>
          </div>

          <SimulatorControls
            device={tabState.device}
            showScrollbar={tabState.showScrollbar}
            onDeviceChange={changeDevice}
            onToggleScrollbar={toggleScrollbar}
            onDeactivate={deactivateSimulator}
          />
        </div>
      ) : (
        <div className="simulator-inactive">
          <div className="welcome-message">
            <h3>Welcome to Device Simulator</h3>
            <p>Simulate different mobile devices and test responsive design.</p>
          </div>

          <DeviceSelector
            selectedDevice={tabState.device}
            onDeviceSelect={(device) =>
              setTabState((prev) => ({ ...prev, device }))
            }
          />

          <button
            className="btn btn-primary btn-large"
            onClick={() => activateSimulator()}
          >
            Activate Simulator
          </button>
        </div>
      )}
    </div>
  );
};

export default PopupApp;
