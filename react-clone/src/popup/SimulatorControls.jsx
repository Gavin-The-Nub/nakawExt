import React from "react";
import { DEVICES } from "../shared/devices";

const SimulatorControls = ({
  device,
  showScrollbar,
  onDeviceChange,
  onToggleScrollbar,
  onDeactivate,
}) => {
  return (
    <div className="simulator-controls">
      <div className="control-section">
        <h4>Device Settings</h4>

        <div className="control-group">
          <label>Change Device:</label>
          <select
            value={device.slug}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="device-select"
          >
            {DEVICES.map((dev) => (
              <option key={dev.slug} value={dev.slug}>
                {dev.name} ({dev.viewport.width}×{dev.viewport.height})
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Scrollbar:</label>
          <button
            className={`toggle-btn ${showScrollbar ? "active" : ""}`}
            onClick={onToggleScrollbar}
          >
            {showScrollbar ? "Hide" : "Show"} Scrollbar
          </button>
        </div>
      </div>

      <div className="control-section">
        <h4>Device Information</h4>
        <div className="device-details">
          <div className="detail-item">
            <span className="label">Platform:</span>
            <span className="value">{device.platform}</span>
          </div>
          <div className="detail-item">
            <span className="label">Resolution:</span>
            <span className="value">
              {device.viewport.width} × {device.viewport.height}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">User Agent:</span>
            <span className="value ua-preview">
              {device.ua.length > 50
                ? device.ua.substring(0, 50) + "..."
                : device.ua}
            </span>
          </div>
        </div>
      </div>

      <div className="control-actions">
        <button className="btn btn-danger" onClick={onDeactivate}>
          Deactivate Simulator
        </button>
      </div>
    </div>
  );
};

export default SimulatorControls;
