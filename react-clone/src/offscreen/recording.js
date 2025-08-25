// Offscreen recording functionality - Frame-based approach with MediaRecorder
let isRecording = false;
let recordingStartTime = null;
let timerInterval = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimeout = null;
let mockupBounds = null;
let frameInterval = null;
let canvas = null;
let ctx = null;
let stream = null;
let tabStream = null; // Add missing tabStream variable

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, stream: streamData, mockupBounds: bounds } = message;

    switch (type) {
        case "START_FRAME_RECORDING":
            startFrameRecording(bounds);
            sendResponse({ ok: true });
            break;
        case "TAB_CAPTURE_STREAM":
            startRecordingWithStream(streamData, bounds);
            sendResponse({ ok: true });
            break;
        case "STOP_RECORDING":
            stopRecording();
            sendResponse({ ok: true });
            break;
        case "GET_RECORDING_STATUS":
            sendResponse({
                isRecording: isRecording,
                duration: getRecordingDuration(),
                chunks: recordedChunks.length
            });
            break;
        case "PING":
            sendResponse({ ok: true, ready: true });
            break;
    }
    return true; // Keep message channel open for async responses
});

function startFrameRecording(bounds) {
    console.log("Starting frame-based recording with bounds:", bounds);
    
    if (isRecording) {
        console.log("Already recording");
        return;
    }

    // Store bounds
    mockupBounds = bounds;
    
    // Debug: Log the mockup bounds structure
    if (bounds && bounds.frame) {
        console.log("Mockup frame bounds:", bounds.frame);
        console.log("Mockup screen bounds:", bounds.screen);
        console.log("Mockup orientation:", bounds.orientation);
    } else {
        console.warn("Invalid mockup bounds structure:", bounds);
    }

    // Initialize recording state
    isRecording = true;
    recordedChunks = [];
    recordingStartTime = Date.now();
    
    // Start timer
    startTimer();
    updateStatus("Recording... (Frame capture active)");
    updateRecordButton(true);
    
    // Initialize canvas for frame capture
    initializeCanvas();
    
    // Start frame capture
    startFrameCapture();
    
    // Set a timeout to ensure recording can be stopped (max 5 minutes)
    recordingTimeout = setTimeout(() => {
        if (isRecording) {
            console.log("Recording timeout reached, stopping automatically");
            stopRecording();
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log("Frame-based recording started successfully");
}

function startRecordingWithStream(stream, bounds) {
    console.log("Starting recording with tab capture stream:", stream);
    
    if (isRecording) {
        console.log("Already recording");
        return;
    }

    if (!stream) {
        console.error("No stream provided");
        updateStatus("Error: No capture stream available");
        return;
    }

    // Store stream and bounds
    tabStream = stream;
    mockupBounds = bounds;

    // Initialize recording state
    isRecording = true;
    recordedChunks = [];
    recordingStartTime = Date.now();
    
    // Start timer
    startTimer();
    updateStatus("Recording... (Tab capture active)");
    updateRecordButton(true);
    
    // Create MediaRecorder with the tab capture stream
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
        updateStatus("Error: No supported video format found");
        stopRecording();
        return;
    }
    
    try {
        // Clone the stream to avoid issues
        const streamClone = stream.clone();
        
        mediaRecorder = new MediaRecorder(streamClone, {
            mimeType: mimeType,
            videoBitsPerSecond: 8000000 // 8 Mbps for high quality
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log('Video chunk recorded:', event.data.size, 'bytes');
            } else {
                console.warn('Empty video chunk received');
            }
        };
        
        mediaRecorder.onstop = () => {
            console.log('MediaRecorder stopped, chunks:', recordedChunks.length);
            if (recordedChunks.length > 0) {
                const videoBlob = new Blob(recordedChunks, { type: mimeType });
                console.log('Video blob created:', videoBlob.size, 'bytes');
                downloadVideo(videoBlob);
            } else {
                console.error('No video data recorded');
                updateStatus("No video data recorded");
            }
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            updateStatus("Recording error: " + event.error.message);
            stopRecording();
        };
        
        // Start recording with high frame rate
        mediaRecorder.start(50); // Collect data every 50ms for 60 FPS recording
        console.log('MediaRecorder started with MIME type:', mimeType);
        
        console.log("Tab capture recording started successfully");
        
    } catch (error) {
        console.error("Error starting MediaRecorder:", error);
        updateStatus("Error starting recording: " + error.message);
        stopRecording();
    }
}

function initializeCanvas() {
    // Create canvas for frame capture
    // Use dimensions that work well for mobile mockups (portrait orientation)
    canvas = document.createElement('canvas');
    canvas.width = 1080;  // Optimized for mobile mockups
    canvas.height = 1920; // Portrait orientation (height > width)
    ctx = canvas.getContext('2d');
    
    // Draw a test pattern to verify canvas is working
    drawTestPattern();
    
    // Create stream from canvas
    stream = canvas.captureStream(60); // 60 FPS for ultra-smooth recording
    
    // Create MediaRecorder with canvas stream
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
        updateStatus("Error: No supported video format found");
        stopRecording();
        return;
    }
    
    try {
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 8000000 // 8 Mbps for high quality
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log('Video chunk recorded:', event.data.size, 'bytes');
            } else {
                console.warn('Empty video chunk received');
            }
        };
        
        mediaRecorder.onstop = () => {
            console.log('MediaRecorder stopped, chunks:', recordedChunks.length);
            if (recordedChunks.length > 0) {
                const videoBlob = new Blob(recordedChunks, { type: mimeType });
                console.log('Video blob created:', videoBlob.size, 'bytes');
                downloadVideo(videoBlob);
            } else {
                console.error('No video data recorded');
                updateStatus("No video data recorded");
            }
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            updateStatus("Recording error: " + event.error.message);
            stopRecording();
        };
        
        // Start recording
        mediaRecorder.start(50); // Collect data every 50ms for 60 FPS
        console.log('MediaRecorder started with MIME type:', mimeType);
        
    } catch (error) {
        console.error("Error starting MediaRecorder:", error);
        updateStatus("Error starting recording: " + error.message);
        stopRecording();
    }
}

function startFrameCapture() {
    // Start capturing frames at regular intervals
    frameInterval = setInterval(() => {
        if (isRecording) {
            captureFrame();
        }
    }, 16); // ~60 FPS (1000ms / 60 = 16.67ms)
}

function captureFrame() {
    // Request a frame from the background script
    console.log("Requesting frame capture...");
    chrome.runtime.sendMessage({
        type: "CAPTURE_FRAME"
    }, (response) => {
        console.log("Frame capture response received:", response);
        
        if (chrome.runtime.lastError) {
            console.error("Frame capture error:", chrome.runtime.lastError);
            // Continue trying to capture frames even if one fails
            return;
        }
        
        if (response && response.ok && response.dataUrl) {
            console.log("Frame data received, length:", response.dataUrl.length);
            // Draw the captured frame to canvas with cropping
            const img = new Image();
            img.onload = () => {
                console.log("Frame image loaded successfully");
                if (ctx && canvas) {
                    if (mockupBounds && mockupBounds.frame) {
                        // Crop and draw only the mockup area
                        cropAndDrawFrame(img);
                    } else {
                        // Fallback: draw full frame if no bounds
                        console.warn("No mockup bounds, drawing full frame");
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                }
            };
            img.onerror = () => {
                console.error("Failed to load captured frame image");
            };
            img.src = response.dataUrl;
        } else {
            console.warn("Invalid frame response:", response);
        }
    });
}

function drawTestPattern() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a test pattern to verify canvas is working
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some test shapes
    ctx.fillStyle = '#3498db';
    ctx.fillRect(100, 100, 200, 200);
    
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(400, 300, 100, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Canvas Test Pattern', canvas.width / 2, 600);
    ctx.fillText('Mockup Recording', canvas.width / 2, 700);
    
    console.log("Test pattern drawn to canvas");
}

function cropAndDrawFrame(img) {
    if (!mockupBounds || !mockupBounds.frame) {
        console.warn("No mockup bounds available, drawing full frame");
        // Fallback: draw full frame if no bounds
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return;
    }
    
    const bounds = mockupBounds.frame;
    const { x, y, width, height } = bounds;
    
    console.log("Cropping frame to mockup area:", { x, y, width, height });
    console.log("Canvas dimensions:", { width: canvas.width, height: canvas.height });
    
    // Calculate scaling to fit mockup area to canvas
    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
    
    // Calculate centered position
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;
    
    console.log("Scaling info:", { scale, scaledWidth, scaledHeight, offsetX, offsetY });
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw only the cropped mockup area, scaled to fit canvas
    ctx.drawImage(
        img,                    // Source image
        x, y, width, height,    // Source rectangle (crop area)
        offsetX, offsetY,       // Destination position (centered)
        scaledWidth, scaledHeight // Destination size (scaled)
    );
}

function getSupportedMimeType() {
    const types = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
        'video/ogg'
    ];
    
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return null;
}

function stopRecording() {
    if (!isRecording) return;
    
    console.log("Stopping recording...");
    isRecording = false;
    
    // Clear recording timeout
    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
    
    // Stop frame capture
    if (frameInterval) {
        clearInterval(frameInterval);
        frameInterval = null;
    }
    
    // Stop timer
    stopTimer();
    
    updateStatus("Processing recording...");
    updateRecordButton(false);
    
    // Stop MediaRecorder if it's recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        try {
            mediaRecorder.stop();
            console.log("MediaRecorder stopped successfully");
        } catch (error) {
            console.error("Error stopping MediaRecorder:", error);
            updateStatus("Error stopping recording: " + error.message);
        }
    }
    
    // Stop the tab capture stream if it exists
    if (tabStream) {
        try {
            tabStream.getTracks().forEach(track => track.stop());
            console.log("Tab capture stream stopped");
        } catch (error) {
            console.error("Error stopping tab stream:", error);
        }
        tabStream = null;
    }
    
    // Stop canvas stream if it exists
    if (stream) {
        try {
            stream.getTracks().forEach(track => track.stop());
            console.log("Canvas stream stopped");
        } catch (error) {
            console.error("Error stopping canvas stream:", error);
        }
        stream = null;
    }
    
    // Clear references
    mockupBounds = null;
    canvas = null;
    ctx = null;
}

function downloadVideo(videoBlob) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const extension = videoBlob.type.includes('webm') ? 'webm' : 
                     videoBlob.type.includes('mp4') ? 'mp4' : 'ogg';
    const filename = `mockup-recording-${timestamp}.${extension}`;
    
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL after a delay
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
    
    console.log(`Video downloaded: ${filename}`);
    updateStatus("Video recording completed successfully!");
    
    // Notify background script that recording completed
    chrome.runtime.sendMessage({
        type: "RECORDING_COMPLETED"
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        updateTimer();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    const duration = getRecordingDuration();
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function getRecordingDuration() {
    if (!recordingStartTime) return 0;
    return Math.floor((Date.now() - recordingStartTime) / 1000);
}

function updateStatus(text) {
    const statusElement = document.getElementById('statusText');
    if (statusElement) {
        statusElement.textContent = text;
    }
    console.log("Status:", text);
}

function updateRecordButton(isRecording) {
    const btn = document.getElementById('recordBtn');
    if (btn) {
        if (isRecording) {
            btn.textContent = 'Stop Recording';
            btn.classList.add('recording');
        } else {
            btn.textContent = 'Start Recording';
            btn.classList.remove('recording');
        }
    }
}

// Handle manual button clicks (for testing)
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('recordBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            } else {
                updateStatus("Click the record button in the toolbar to start recording");
            }
        });
    }
    
    // Initialize
    updateStatus("Ready to record (Tab Capture + MediaRecorder)");
    updateRecordButton(false);
});
