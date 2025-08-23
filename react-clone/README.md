# Mobile Device Simulator - React Version

A Chrome extension that simulates mobile devices with realistic mockups, recreated in React.js with Three.js support for future 3D visualization.

## 🎯 How It Works

This extension replicates the original Mobile FIRST extension's functionality:

1. **Popup**: Automatically activates the simulator and closes immediately
2. **Background Script**: Manages device states, user agent spoofing, and simulator overlay
3. **Device Panel**: Floating panel with device selection buttons
4. **Simulator Overlay**: Full-screen overlay with realistic device mockups containing iframes

## ✨ Features

- **Realistic Device Mockups**: Uses actual device PNG images with proper screen cutouts
- **User Agent Spoofing**: Changes browser user agent to match selected device
- **Device Selection**: Choose from 30+ devices (iPhone, Android, MacBook, etc.)
- **Scrollbar Control**: Toggle scrollbar visibility
- **Keyboard Shortcuts**: Ctrl+Shift+M to toggle simulator
- **Context Menu**: Right-click to toggle simulator
- **Automatic Activation**: Popup activates simulator immediately

## 🚀 Installation

1. **Build the Extension**:

   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome**:

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Use the Extension**:
   - Click the extension icon to activate simulator
   - Use the floating device panel to change devices
   - Right-click or use Ctrl+Shift+M to toggle

## 📱 Supported Devices

### iOS Devices

- iPhone 16, 15, 14, 13, 12, 11 series
- iPhone SE, X, XR
- iPad Air, Mini, Pro
- Apple Watch

### Android Devices

- Google Pixel 5, 6, 8
- Samsung Galaxy S20, S22, S24 series
- Samsung Galaxy Fold, Z Flip
- Huawei P30 Pro
- OnePlus Nord 2

### Desktop Devices

- MacBook Air, MacBook Pro
- Apple iMac
- Dell Latitude

## 🏗️ Architecture

```
src/
├── background/          # Background service worker
│   └── index.js        # Device state management, UA spoofing
├── popup/              # Extension popup
│   ├── popup.html      # Simple popup interface
│   └── popup.js        # Auto-activate simulator
├── devicePanel/        # Device selection panel
│   └── devicePanel.js  # Floating device selector
├── content/            # Content script
│   └── index.js        # Message handling
├── shared/             # Shared utilities
│   └── devices.js      # Device definitions
└── assets/             # Device mockup images
    └── devices/        # PNG mockups
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development mode (watch for changes)
npm run dev
```

## 🎨 Key Differences from Original

- **React Ready**: Built with React.js architecture for future Three.js integration
- **Modern Build**: Uses Webpack for bundling and optimization
- **Clean Code**: Well-structured, maintainable codebase
- **Future-Proof**: Prepared for 3D device visualization with Three.js

## 🚧 Future Enhancements

- **Three.js Integration**: 3D device visualization
- **Device Rotation**: Landscape/portrait orientation
- **Custom Devices**: Add your own device mockups
- **Advanced Controls**: Touch simulation, device-specific features

## 📄 License

This project recreates the functionality of the original Mobile FIRST extension for educational and development purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This is a React-based recreation of the original Mobile FIRST extension, designed to maintain the same functionality while providing a modern development foundation for future enhancements.
