# Installation Guide - React Device Simulator Extension

## Quick Start

1. **Build the Extension**

   ```bash
   cd react-clone
   npm install --legacy-peer-deps
   npm run build
   ```

2. **Load in Chrome**

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

3. **Use the Extension**
   - Click the extension icon in your browser toolbar
   - Select a device from the dropdown
   - Click "Activate Simulator"
   - The current tab will simulate the selected device

## Features Implemented

✅ **Core Functionality**

- Device simulation with accurate viewport sizes
- User agent spoofing
- Real-time device switching
- Scrollbar toggle control
- Modern React-based UI

✅ **Device Support**

- iPhone 11-16 series (all variants)
- Google Pixel devices
- MacBook Air, iMac, Dell Latitude
- Apple Watch
- Huawei P30 Pro

✅ **User Interface**

- Beautiful popup interface with device selection
- Device preview with mockups
- Searchable device dropdown
- Status indicators and controls
- Responsive design

✅ **Browser Integration**

- Context menu integration
- Keyboard shortcuts (Ctrl+Shift+M)
- Tab state management
- Content script overlay

## Architecture

### React Components

- `PopupApp` - Main popup interface
- `DeviceSelector` - Searchable device dropdown
- `SimulatorControls` - Active simulator controls
- `DevicePreview` - 2D device mockup
- `DevicePanelApp` - Device panel (2D view ready for 3D)

### Extension Structure

- `background.js` - Service worker for device management
- `content.js` - Content script for viewport manipulation
- `popup.js` - React popup interface
- `devicePanel.js` - Device selection panel

## Future Enhancements

🚀 **Three.js Integration Ready**

- The foundation is set up for 3D device visualization
- `@react-three/fiber` and `@react-three/drei` are installed
- Device panel has placeholder for 3D view
- Can be enhanced with actual 3D device models

🔧 **Potential Improvements**

- 3D device models with realistic materials
- Device rotation and interaction
- Custom device creation
- Screenshot and recording capabilities
- Network throttling simulation
- Touch gesture simulation

## Development

### Available Scripts

```bash
npm run build    # Production build
npm run dev      # Development build with watch
npm start        # Development server
```

### Project Structure

```
react-clone/
├── src/
│   ├── popup/              # React popup interface
│   ├── background/         # Service worker
│   ├── content/           # Content script
│   ├── devicePanel/       # Device panel (2D/3D ready)
│   ├── shared/            # Shared utilities
│   └── manifest.json      # Extension manifest
├── dist/                  # Built extension
└── webpack.config.js      # Build configuration
```

## Troubleshooting

### Build Issues

- Use `--legacy-peer-deps` for npm install
- Three.js dependencies are configured but simplified for now
- Webpack handles all bundling automatically

### Extension Issues

- Make sure "Developer mode" is enabled in Chrome
- Reload the extension after making changes
- Check browser console for any errors
- Verify manifest.json permissions

## Next Steps for Three.js Integration

1. **Add 3D Device Models**

   - Create or source GLTF/GLB models for devices
   - Use `useGLTF` hook to load models
   - Implement realistic materials and lighting

2. **Enhanced Device Panel**

   - Enable 3D view in DevicePanelApp
   - Add camera controls and device rotation
   - Implement device interaction

3. **Performance Optimization**
   - Lazy load 3D components
   - Optimize model file sizes
   - Implement proper cleanup

The extension is now ready for use and future enhancement with Three.js!
