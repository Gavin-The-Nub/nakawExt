# Mobile View + Scrollbar Toggle (Basic Clone)

A Chrome extension that provides mobile device simulation and screen recording capabilities.

## Features

### Device Simulation

- Force mobile view per-tab using Declarative Net Request (DNR)
- Toggle native scrollbar via injected CSS
- Multiple device presets (iPhone, Android, iPad, MacBook, etc.)
- Device mockup overlay with realistic bezels

### Screen Recording

- Record screen content with device mockup overlay
- Multiple quality settings (low, medium, high)
- Keyboard shortcut support (Ctrl+Shift+R or Cmd+Shift+R)
- Automatic video download in WebM format

## Usage

### Device Simulation

1. Click the extension icon to activate
2. Use the device button in the simulator to change devices
3. Toggle scrollbar visibility as needed

### Screen Recording

1. Open the device simulator
2. Click the recording button (circle icon) to start recording
3. Click the stop button (square icon) to stop recording
4. Video will automatically download when complete

### Keyboard Shortcuts

- `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac): Start/Stop screen recording

## Permissions

- `declarativeNetRequest`: Modify request/response headers for mobile simulation
- `scripting`: Inject CSS and JavaScript for UI controls
- `tabs`: Access tab information and capture
- `storage`: Save user preferences
- `activeTab`: Access current tab
- `tabCapture`: Capture tab content for recording
- `offscreen`: Create offscreen document for recording
- `commands`: Enable keyboard shortcuts
- `downloads`: Download recorded videos

## Technical Details

### Screen Recording

- Uses Chrome's `tabCapture` API for high-quality screen capture
- Offscreen document handles MediaRecorder for video encoding
- Supports multiple codecs (H.264, VP9, WebM)
- Configurable quality settings and frame rates

### Device Simulation

- DNR rules modify User-Agent and other headers
- CSS injection for scrollbar control
- Device mockup overlay with SVG clipping
- Responsive design for different screen sizes

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `basic_clone` folder
5. The extension will be installed and ready to use

## Development

The extension is built with vanilla JavaScript and follows Chrome Extension Manifest V3 standards. Key files:

- `background.js`: Service worker for background tasks
- `device-panel.js`: Content script for device selection UI
- `offscreen/tab_capture/`: Screen recording implementation
- `manifest.json`: Extension configuration
