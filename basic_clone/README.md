# Basic Clone Extension - Auto-Simulator Version

This is a simplified version of the mobile device simulator extension with automatic simulator activation and improved scrollbar handling.

## Key Features

### Instant Automatic Device Simulator
- **Immediate Activation**: The simulator appears instantly when you click the extension icon
- **Auto-Close Popup**: The popup automatically closes after activating the simulator so you can see it immediately
- **Default Device**: iPhone 15 Pro is set as the default device
- **No Manual Toggle**: No need to manually enable/disable the simulator - it's always on
- **Auto-Refresh**: Simulator automatically updates when you change devices
- **Tab-Specific**: Only works on the specific tab where the extension was activated

### Improved Scrollbar Handling
- **Completely Hidden by Default**: Scrollbars are completely hidden on both the main page and iframe
- **Functional Scrolling**: Content can still be scrolled even when scrollbars are hidden
- **No Double Scrollbars**: Fixed the issue with multiple scrollbars appearing
- **Main Page Locked**: Main page scrolling is disabled when simulator is active
- **Toggle Option**: You can still show/hide scrollbars manually if needed

### Mobile User Agent
- **Automatic**: Mobile user agent is automatically enabled for the activated tab
- **Device-Specific**: Uses proper device-specific user agent strings
- **Platform Detection**: Correct mobile headers and platform detection

## How It Works

1. **Click Extension Icon**: When you click the extension icon, it immediately activates the simulator
2. **Popup Closes**: The popup automatically closes after activation so you can see the simulator
3. **Simulator Appears**: The device mockup appears on the current page with the content inside
4. **Tab-Specific**: The extension only affects the tab where it was activated
5. **Fallback Interface**: If activation fails, the popup shows the manual controls

## Fixed Issues

### 1. CSS Accuracy for Phone Models
- **Problem**: The CSS wasn't being applied correctly to make content look like it's inside the device mockup
- **Solution**: Improved the simulator implementation with:
  - Better mockup container styling with rounded corners and shadows
  - Proper iframe positioning under the mockup image
  - Enhanced overlay styling for better visual presentation
  - Added pointer-events handling to prevent mockup image from blocking interactions

### 2. Scrollbar Functionality
- **Problem**: Scrollbar toggle wasn't working properly - content wasn't scrolling, and double scrollbars appeared
- **Solution**: Fixed the `applyScrollbar` function with:
  - Complete scrollbar hiding using `display: none` and `width: 0`
  - Main page scrolling disabled when simulator is active
  - Iframe scrollbars hidden while preserving scrolling functionality
  - Better CSS injection targeting all frames and iframe content
  - Ensured scrolling functionality is preserved when scrollbars are hidden

### 3. Automatic Activation
- **Problem**: Simulator wasn't appearing automatically when the extension was clicked
- **Solution**: Added immediate activation with:
  - New `ACTIVATE_SIMULATOR_FOR_TAB` message handler
  - Automatic popup closing after activation
  - Loading states and fallback interface
  - Better error handling

### 4. Tab-Specific Behavior
- **Problem**: Extension was affecting all tabs instead of just the activated tab
- **Solution**: Made the extension tab-specific by:
  - Removing automatic application to all tabs
  - Only applying settings to explicitly activated tabs
  - Preventing global state from affecting other tabs
  - Ensuring each tab maintains its own independent state

## Usage

1. **Install the extension** in Chrome
2. **Click the extension icon** - the simulator automatically appears and popup closes
3. **Tab-Specific**: The extension only affects the current tab where you clicked it
4. **Select a device** from the dropdown to change the mockup (if popup is open)
5. **Toggle Scrollbar** (optional) to show/hide scrollbars on the page
6. **Close simulator** using the "Close" button if needed
7. **Activate on other tabs**: Click the extension icon on other tabs to activate the simulator there

## Technical Details

### Files Modified
- `background.js`: 
  - Fixed scrollbar CSS injection and improved simulator implementation
  - Added automatic simulator activation with `ACTIVATE_SIMULATOR_FOR_TAB` handler
  - Created reusable showSimulator/hideSimulator functions
  - Set iPhone 15 Pro as default device
  - Made extension tab-specific by removing global application
- `popup.html`: 
  - Added loading states with spinner animation
  - Enhanced UI with better styling and status indicators
  - Updated status messages to reflect automatic behavior
- `popup.js`: 
  - Added immediate simulator activation when popup opens
  - Automatic popup closing after activation
  - Fallback interface if activation fails
  - Better error handling and user feedback

### Key Improvements
- **Instant Activation**: Simulator shows immediately when extension is clicked
- **Auto-Close Popup**: Popup closes automatically to show simulator
- **Loading States**: Visual feedback during activation
- **Tab-Specific**: Only affects the tab where extension was activated
- **Better Error Handling**: Improved error handling in CSS injection
- **Improved State Management**: Better state management and persistence
- **Enhanced User Interface**: Cleaner UI with visual feedback
- **Proper Cleanup**: Better cleanup when simulator is closed
- **Device Information**: Real-time device information display
- **Scrollbar Fix**: Eliminated double scrollbar issue while preserving scrolling functionality

## Browser Compatibility
- Chrome/Chromium browsers with Manifest V3 support
- Requires `declarativeNetRequest` and `scripting` permissions
