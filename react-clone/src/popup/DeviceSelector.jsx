import React, { useState, useRef, useEffect } from "react";
import { DEVICES } from "../shared/devices";

const DeviceSelector = ({ selectedDevice, onDeviceSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Filter devices based on search term
  const filteredDevices = DEVICES.filter(
    (device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group devices by platform
  const groupedDevices = filteredDevices.reduce((groups, device) => {
    if (!groups[device.platform]) {
      groups[device.platform] = [];
    }
    groups[device.platform].push(device);
    return groups;
  }, {});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeviceSelect = (device) => {
    onDeviceSelect(device);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="device-selector" ref={dropdownRef}>
      <div className="selector-header">
        <label>Select Device:</label>
        <button className="selector-toggle" onClick={() => setIsOpen(!isOpen)}>
          <span>{selectedDevice.name}</span>
          <span className="arrow">{isOpen ? "▲" : "▼"}</span>
        </button>
      </div>

      {isOpen && (
        <div className="device-dropdown">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="device-search"
              autoFocus
            />
          </div>

          <div className="device-list">
            {Object.entries(groupedDevices).map(([platform, devices]) => (
              <div key={platform} className="device-group">
                <div className="platform-header">{platform}</div>
                {devices.map((device) => (
                  <button
                    key={device.slug}
                    className={`device-option ${
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
                    {selectedDevice.slug === device.slug && (
                      <span className="checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;
