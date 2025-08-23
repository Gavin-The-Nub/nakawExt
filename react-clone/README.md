# Mobile Device Simulator - React Extension

A modern browser extension built with React and Three.js for simulating mobile devices and testing responsive design.

## Features

- **Device Simulation**: Simulate various mobile devices with accurate viewport sizes and user agents
- **Real-time Viewport Control**: Change device viewports on the fly
- **User Agent Spoofing**: Automatically spoof user agents to match selected devices
- **Scrollbar Control**: Toggle scrollbar visibility for better mobile testing
- **Modern UI**: Beautiful React-based popup interface
- **Three.js Support**: Ready for 3D device visualization (future enhancement)
- **Keyboard Shortcuts**: Quick toggle with Ctrl+Shift+M
- **Context Menu Integration**: Right-click to toggle simulator

## Supported Devices

### iOS Devices

- iPhone 11, 11 Pro, 11 Pro Max
- iPhone 12, 12 mini, 12 Pro, 12 Pro Max
- iPhone 13, 13 mini, 13 Pro, 13 Pro Max
- iPhone 14, 14 Max, 14 Pro, 14 Pro Max
- iPhone 15, 15 Plus, 15 Pro, 15 Pro Max
- iPhone 16, 16 Plus, 16 Pro Max

### Android Devices

- Google Pixel 5, 6, 8
- Huawei P30 Pro
- Samsung Galaxy devices (various models)

### Desktop/Laptop

- MacBook Air
- Apple iMac 24"
- Dell Latitude
- Apple Watch Series 6

## Installation

### Development Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd react-clone
```

2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from this project

### Production Build

```bash
npm run build
```

The built extension will be in the `dist` folder, ready for distribution.

## Development

### Available Scripts

- `npm run build` - Build the extension for production
- `npm run dev` - Build in development mode with watch
- `npm start` - Start development server (for testing)

### Project Structure

```
react-clone/
├── src/
│   ├── popup/              # React popup interface
│   │   ├── PopupApp.jsx    # Main popup component
│   │   ├── DeviceSelector.jsx
│   │   ├── SimulatorControls.jsx
│   │   ├── DevicePreview.jsx
│   │   └── popup.css
│   ├── background/         # Service worker
│   │   └── index.js
│   ├── content/           # Content script
│   │   └── index.js
│   ├── devicePanel/       # 3D device panel (Three.js)
│   │   ├── DevicePanelApp.jsx
│   │   └── devicePanel.html
│   ├── shared/            # Shared utilities
│   │   └── devices.js
│   ├── icons/             # Extension icons
│   ├── assets/            # Static assets
│   └── manifest.json      # Extension manifest
├── webpack.config.js      # Webpack configuration
└── package.json
```

## Usage

### Basic Usage

1. Click the extension icon in your browser toolbar
2. Select a device from the dropdown
3. Click "Activate Simulator"
4. The current tab will be transformed to simulate the selected device

### Advanced Features

- **Device Panel**: Click "Change Device" in the active simulator to open the 3D device panel
- **Scrollbar Toggle**: Use the scrollbar toggle button to show/hide scrollbars
- **Keyboard Shortcut**: Press `Ctrl+Shift+M` to quickly toggle the simulator
- **Context Menu**: Right-click on any page and select "Toggle Device Simulator"

### Three.js Integration

The extension includes Three.js support for future 3D device visualization:

- The `DevicePanelApp.jsx` component includes a basic Three.js scene
- You can enhance it by adding actual 3D device models
- Use `useGLTF` to load GLTF/GLB models
- Implement realistic device mockups with proper materials and lighting

## Technical Details

### Architecture

- **Background Script**: Manages device states and user agent spoofing
- **Content Script**: Handles viewport manipulation and UI overlay
- **Popup**: React-based interface for device selection and controls
- **Device Panel**: Three.js-powered 3D visualization (future enhancement)

### Browser APIs Used

- `chrome.declarativeNetRequest` - User agent spoofing
- `chrome.tabs` - Tab management
- `chrome.storage` - State persistence
- `chrome.contextMenus` - Context menu integration
- `chrome.commands` - Keyboard shortcuts

### React Components

- **PopupApp**: Main popup interface
- **DeviceSelector**: Searchable device dropdown
- **SimulatorControls**: Active simulator controls
- **DevicePreview**: 2D device mockup
- **DevicePanelApp**: 3D device visualization

## Future Enhancements

- [ ] 3D device models with realistic materials
- [ ] Device rotation and interaction in 3D view
- [ ] Custom device creation
- [ ] Device presets for common testing scenarios
- [ ] Screenshot and recording capabilities
- [ ] Network throttling simulation
- [ ] Touch gesture simulation
- [ ] Device-specific CSS injection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Credits

Built with:

- React 18
- Three.js
- @react-three/fiber
- @react-three/drei
- Webpack
- Chrome Extension APIs
