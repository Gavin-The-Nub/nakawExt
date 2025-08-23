import React from "react";

const DevicePreview = ({ device }) => {
  // For now, we'll use a simple 2D preview
  // In the future, this can be enhanced with Three.js for 3D device mockups
  const { viewport, platform } = device;

  // Calculate preview dimensions (scaled down for popup)
  const maxWidth = 200;
  const maxHeight = 300;
  const scale = Math.min(
    maxWidth / viewport.width,
    maxHeight / viewport.height
  );
  const previewWidth = viewport.width * scale;
  const previewHeight = viewport.height * scale;

  return (
    <div className="device-preview">
      <div className="preview-container">
        <div
          className="device-mockup"
          style={{
            width: previewWidth,
            height: previewHeight,
            backgroundColor: platform === "iOS" ? "#000" : "#333",
            borderRadius: platform === "iOS" ? "20px" : "10px",
            position: "relative",
            margin: "0 auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {/* Screen */}
          <div
            className="device-screen"
            style={{
              width: "90%",
              height: "85%",
              backgroundColor: "#fff",
              position: "absolute",
              top: "7.5%",
              left: "5%",
              borderRadius: platform === "iOS" ? "12px" : "6px",
              border: "1px solid #ccc",
            }}
          >
            {/* Screen content placeholder */}
            <div className="screen-content">
              <div className="status-bar">
                <span className="time">9:41</span>
                <span className="battery">100%</span>
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

          {/* Home indicator for iOS */}
          {platform === "iOS" && (
            <div
              className="home-indicator"
              style={{
                width: "30%",
                height: "4px",
                backgroundColor: "#fff",
                position: "absolute",
                bottom: "8px",
                left: "35%",
                borderRadius: "2px",
              }}
            />
          )}

          {/* Camera for iOS */}
          {platform === "iOS" && (
            <div
              className="camera"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#333",
                position: "absolute",
                top: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                borderRadius: "50%",
              }}
            />
          )}
        </div>
      </div>

      <div className="preview-info">
        <div className="resolution-info">
          {viewport.width} × {viewport.height}
        </div>
      </div>
    </div>
  );
};

export default DevicePreview;
