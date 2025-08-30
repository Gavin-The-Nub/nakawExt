import React, { useState } from "react";
import Iphone from "../models/Iphone";
import Macbook from "../models/Macbook";
// Temporarily using iPhone for iPad until iPad model is available
const Ipad = Iphone;
// Options-only panel; rendering is handled by the content script in the mockup area

const DevicePanelApp = ({ onSelectModel }) => {
  const models = [
    { key: "iphone", name: "iPhone 14", component: Iphone },
    { key: "ipad", name: "iPad Pro", component: Ipad },
    { key: "macbook", name: "MacBook Pro M3", component: Macbook },
  ];
  const [selectedModelKey, setSelectedModelKey] = useState(models[0].key);

  

  return (
    <div className="device-panel-app">
      <header className="panel-header">
        <h1>3D Device Panel</h1>
      </header>

      <div className="panel-content">
        <div className="device-list-sidebar">
          <h3>3D Models</h3>
          {models.map((m) => (
            <button
              key={m.key}
              className={`device-btn ${selectedModelKey === m.key ? "selected" : ""}`}
              onClick={() => {
                setSelectedModelKey(m.key);
                if (onSelectModel) onSelectModel(m.key);
              }}
            >
              <div className="device-info">
                <div className="device-name">{m.name}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="device-preview-area" style={{display:"none"}} />
      </div>

      <style jsx>{`
        .device-panel-app {
          width: 100vw;
          height: 70vh;
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
          overflow: auto;
          min-height: 0;
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

        .device-preview-2d, .device-preview-3d {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          border-radius: 8px;
        }

        .device-preview-3d canvas {
          width: 100% !important;
          height: 100% !important;
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
