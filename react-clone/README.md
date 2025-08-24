# Mobile Device Simulator - React Clone

A browser extension that simulates mobile devices with realistic mockups, built with React and modern web technologies.

## Features

- **Device Simulation**: Simulate various mobile devices and desktop computers
- **Orientation Support**: Switch between portrait and landscape modes
- **Realistic Mockups**: High-quality device mockups with proper screen clipping
- **Screenshot Functionality**: Capture device mockups with web content
- **Device Selection**: Choose from a wide range of iOS, Android, and macOS devices
- **Responsive Design**: Modern UI with smooth animations and transitions

## Screenshot Functionality

The extension includes a powerful screenshot feature that captures the current page content within the device mockup:

### How to Use Screenshots

1. **Activate the Simulator**: Click the extension icon or use the keyboard shortcut `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)
2. **Select a Device**: Choose your preferred device from the device selector
3. **Navigate to Your Page**: Browse to the webpage you want to capture
4. **Take Screenshot**: Click the camera icon (📷) in the floating toolbar
5. **Choose Action**: 
   - **Download**: Save the screenshot as a PNG file
   - **Copy**: Copy the image to your clipboard
   - **Close**: Dismiss the options menu

### Screenshot Features

- **High Quality**: Captures at full device pixel ratio for crisp images
- **Device Mockup**: Automatically composites the screenshot with the device bezel
- **Orientation Aware**: Correctly handles both portrait and landscape orientations
- **Screen Clipping**: Only captures the content within the device screen area
- **Transparent Background**: Maintains transparency for easy integration into designs

### Supported Devices

The screenshot functionality works with all supported devices:

- **iOS Devices**: iPhone 11-16 series, iPad models, Apple Watch
- **Android Devices**: Google Pixel series, Samsung Galaxy series, Huawei, OnePlus
- **Desktop Devices**: MacBook Air, iMac, Dell Latitude

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load the `dist` folder as an unpacked extension in Chrome/Edge

## Development

- **Development mode**: `npm run dev` (watches for changes)
- **Production build**: `npm run build`
- **Start dev server**: `npm start`

## Technical Details

The screenshot functionality uses:
- `chrome.tabs.captureVisibleTab` API for tab capture
- HTML5 Canvas for image processing and compositing
- Device mockup images for realistic bezel overlay
- Clipboard API for copy functionality
- Proper error handling and loading states

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## License

ISC License
