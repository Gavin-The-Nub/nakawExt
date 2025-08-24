// Offscreen recording functionality - Improved video-based approach
let isRecording = false;
let recordingStartTime = null;
let timerInterval = null;
let capturedFrames = [];
let frameInterval = null;
let mediaRecorder = null;
let recordedChunks = [];
let canvas = null;
let ctx = null;
let stream = null;
let recordingTimeout = null; // Timeout to ensure recording can be stopped

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, mockupBounds } = message;

    switch (type) {
        case "START_RECORDING":
            startRecording(mockupBounds);
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
                frameCount: capturedFrames.length
            });
            break;
        case "PING":
            sendResponse({ ok: true, ready: true });
            break;
        case "CREATE_VIDEO_FROM_FRAMES":
            createVideoFromFrames(message.frames, message.width, message.height, sendResponse);
            break;
    }
    return true; // Keep message channel open for async responses
});

function startRecording(mockupBounds) {
    console.log("Starting improved video recording with bounds:", mockupBounds);
    
    if (isRecording) {
        console.log("Already recording");
        return;
    }

    if (!mockupBounds || !mockupBounds.frame) {
        console.error("Invalid mockup bounds:", mockupBounds);
        updateStatus("Error: Invalid mockup bounds");
        return;
    }

    // Initialize recording state
    isRecording = true;
    capturedFrames = [];
    recordedChunks = [];
    recordingStartTime = Date.now();
    
    // Start timer
    startTimer();
    updateStatus("Recording... (Capturing frames)");
    updateRecordButton(true);
    
    // Initialize canvas for video creation
    initializeCanvas(mockupBounds);
    
    // Draw initial placeholder frame to start video stream
    drawPlaceholderFrame();
    
    // Start capturing frames at regular intervals
    startFrameCapture();
    
    // Set a timeout to ensure recording can be stopped (max 5 minutes)
    recordingTimeout = setTimeout(() => {
        if (isRecording) {
            console.log("Recording timeout reached, stopping automatically");
            stopRecording();
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log("Improved video recording started");
}

function initializeCanvas(mockupBounds) {
    // Create canvas for video recording
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match mockup frame
    canvas.width = mockupBounds.frame.width;
    canvas.height = mockupBounds.frame.height;
    
    console.log('Canvas initialized with dimensions:', canvas.width, 'x', canvas.height);
    
    // Create stream from canvas
    stream = canvas.captureStream(2); // 2 FPS
    
    // Initialize MediaRecorder
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
        throw new Error('No supported video format found');
    }
    
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2000000 // 2 Mbps
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
            updateStatus("No video data recorded - trying fallback method");
            // Try fallback method if no video data
            if (capturedFrames.length > 0) {
                createVideoFromCapturedFrames();
            } else {
                updateStatus("No frames captured");
            }
        }
    };
    
    mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        updateStatus("Recording error: " + event.error.message);
    };
    
    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    console.log('MediaRecorder started with MIME type:', mimeType);
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

function startFrameCapture() {
    if (!isRecording) return;
    
    // Capture a frame
    captureFrame();
    
    // Schedule next frame capture (every 500ms = 2 FPS)
    frameInterval = setTimeout(startFrameCapture, 500);
}

function captureFrame() {
    if (!isRecording) return;
    
    console.log("Requesting frame capture...");
    
    chrome.runtime.sendMessage({
        type: "REQUEST_FRAME"
    }, (response) => {
        if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
            console.error("Frame request error:", errorMessage);
            
            // If we can't communicate with background script, stop recording
            if (errorMessage.includes("Could not establish connection")) {
                console.error("Lost connection to background script, stopping recording");
                stopRecording();
                return;
            }
            return;
        }
        
        if (response && response.dataUrl) {
            console.log("Frame captured successfully, length:", response.dataUrl.length);
            
            // Process the frame (crop if needed)
            if (response.cropBounds) {
                console.log("Cropping frame to bounds:", response.cropBounds);
                cropImage(response.dataUrl, response.cropBounds).then((processedDataUrl) => {
                    // Store the frame with timestamp
                    capturedFrames.push({
                        dataUrl: processedDataUrl,
                        timestamp: Date.now() - recordingStartTime
                    });
                    
                    // Draw frame to canvas for video recording
                    drawFrameToCanvas(processedDataUrl);
                    
                    updateStatus(`Recording... (${capturedFrames.length} frames captured)`);
                });
            } else {
                // Store the frame with timestamp
                capturedFrames.push({
                    dataUrl: response.dataUrl,
                    timestamp: Date.now() - recordingStartTime
                });
                
                // Draw frame to canvas for video recording
                drawFrameToCanvas(response.dataUrl);
                
                updateStatus(`Recording... (${capturedFrames.length} frames captured)`);
            }
        } else {
            const errorMessage = response?.error || 'Unknown frame capture error';
            console.warn("Frame capture failed:", errorMessage);
            
            // If we hit quota or permission issues, wait longer
            if (response && response.error) {
                if (response.error.includes("MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND") || 
                    response.error.includes("activeTab permission not in effect") ||
                    response.error.includes("Cannot access tab contents") ||
                    response.error.includes("Window no longer exists") ||
                    response.error.includes("Tab no longer exists")) {
                    console.log("Rate limit, permission, or window issue, waiting 2 seconds...");
                    // Wait longer before next frame
                    if (frameInterval) {
                        clearTimeout(frameInterval);
                        frameInterval = setTimeout(startFrameCapture, 2000);
                    }
                } else {
                    // For other errors, try to continue but log the issue
                    console.log("Frame capture error, continuing...");
                }
            }
        }
    });
}

function drawFrameToCanvas(dataUrl) {
    if (!canvas || !ctx) return;
    
    const img = new Image();
    img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the captured frame to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        console.log("Frame drawn to canvas for video recording");
    };
    img.onerror = (error) => {
        console.error("Error loading frame for canvas:", error);
        // Draw a placeholder frame if image fails to load
        drawPlaceholderFrame();
    };
    img.src = dataUrl;
}

function drawPlaceholderFrame() {
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a placeholder frame
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some text
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Recording...', canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Frame ${capturedFrames.length + 1}`, canvas.width / 2, canvas.height / 2 + 30);
    
    console.log("Placeholder frame drawn to canvas");
}

function cropImage(dataUrl, cropBounds) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // Create a temporary canvas for cropping
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Set canvas size to the crop dimensions
            tempCanvas.width = cropBounds.width;
            tempCanvas.height = cropBounds.height;
            
            // Draw the cropped portion of the image
            tempCtx.drawImage(
                img,
                cropBounds.left, cropBounds.top, cropBounds.width, cropBounds.height, // Source rectangle
                0, 0, cropBounds.width, cropBounds.height // Destination rectangle
            );
            
            // Convert back to data URL
            const croppedDataUrl = tempCanvas.toDataURL('image/png');
            console.log("Image cropped successfully");
            resolve(croppedDataUrl);
        };
        img.onerror = (error) => {
            console.error("Error loading image for cropping:", error);
            resolve(dataUrl); // Return original if cropping fails
        };
        img.src = dataUrl;
    });
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
        clearTimeout(frameInterval);
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
            // Fallback: create video from captured frames
            if (capturedFrames.length > 0) {
                createVideoFromCapturedFrames();
            } else {
                updateStatus("No frames captured");
            }
        }
    } else {
        // Fallback: create video from captured frames
        if (capturedFrames.length > 0) {
            createVideoFromCapturedFrames();
        } else {
            updateStatus("No frames captured");
        }
    }
}

function createVideoFromCapturedFrames() {
    console.log(`Creating video from ${capturedFrames.length} captured frames...`);
    
    if (capturedFrames.length < 2) {
        updateStatus("Not enough frames for recording (need at least 2)");
        return;
    }
    
    // Create canvas for video creation
    const videoCanvas = document.createElement('canvas');
    const videoCtx = videoCanvas.getContext('2d');
    
    // Set canvas size to match frame dimensions
    const firstFrame = capturedFrames[0];
    videoCanvas.width = firstFrame.width || 800;
    videoCanvas.height = firstFrame.height || 600;
    
    console.log('Video canvas created with dimensions:', videoCanvas.width, 'x', videoCanvas.height);
    
    // Create stream from canvas
    const videoStream = videoCanvas.captureStream(2); // 2 FPS
    
    // Initialize MediaRecorder
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
        updateStatus("No supported video format found");
        return;
    }
    
    const videoRecorder = new MediaRecorder(videoStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2000000 // 2 Mbps
    });
    
    const videoChunks = [];
    
    videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            videoChunks.push(event.data);
        }
    };
    
    videoRecorder.onstop = () => {
        if (videoChunks.length > 0) {
            const videoBlob = new Blob(videoChunks, { type: mimeType });
            downloadVideo(videoBlob);
        } else {
            updateStatus("No video data created");
        }
    };
    
    videoRecorder.onerror = (event) => {
        console.error('Video creation error:', event.error);
        updateStatus("Video creation error: " + event.error.message);
    };
    
    // Start recording
    videoRecorder.start(1000);
    
    // Draw frames to canvas at regular intervals
    let frameIndex = 0;
    const frameInterval = setInterval(() => {
        if (frameIndex >= capturedFrames.length) {
            clearInterval(frameInterval);
            videoRecorder.stop();
            return;
        }
        
        // Draw the current frame
        const frame = capturedFrames[frameIndex];
        const img = new Image();
        img.onload = () => {
            videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
            videoCtx.drawImage(img, 0, 0, videoCanvas.width, videoCanvas.height);
            console.log(`Frame ${frameIndex + 1} drawn to video canvas`);
        };
        img.onerror = (error) => {
            console.error(`Error loading frame ${frameIndex + 1}:`, error);
        };
        img.src = frame.dataUrl;
        
        frameIndex++;
    }, 500); // 500ms per frame (2 FPS)
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
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    updateStatus("Ready to record (Improved video-based)");
    updateRecordButton(false);
});

// Function to create video from frames (called by background script)
function createVideoFromFrames(frames, width, height, sendResponse) {
    console.log(`Creating video from ${frames.length} frames, dimensions: ${width}x${height}`);
    
    try {
        // Create a canvas to draw frames
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match frame dimensions
        canvas.width = width;
        canvas.height = height;
        
        console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
        
        // Check supported MIME types
        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            throw new Error('No supported video format found');
        }
        
        // Create MediaRecorder with canvas stream
        const stream = canvas.captureStream(2); // 2 FPS to match our capture rate
        console.log('Canvas stream created:', stream);
        
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 2000000 // 2 Mbps for reasonable quality
        });
        
        console.log('MediaRecorder created:', mediaRecorder);
        
        const recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            console.log('Data available:', event.data.size, 'bytes');
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            console.log('MediaRecorder stopped, chunks:', recordedChunks.length);
            if (recordedChunks.length > 0) {
                const blob = new Blob(recordedChunks, { type: mimeType });
                console.log('Video blob created:', blob.size, 'bytes');
                sendResponse({ ok: true, videoBlob: blob });
            } else {
                sendResponse({ ok: false, error: 'No video data recorded' });
            }
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            sendResponse({ ok: false, error: 'MediaRecorder error: ' + event.error.message });
        };
        
        // Start recording
        mediaRecorder.start(1000); // Collect data every second
        console.log('MediaRecorder started');
        
        // Draw frames to canvas at regular intervals
        let frameIndex = 0;
        const frameInterval = setInterval(() => {
            if (frameIndex >= frames.length) {
                console.log('All frames processed, stopping recording');
                clearInterval(frameInterval);
                mediaRecorder.stop();
                return;
            }
            
            // Draw the current frame
            const frame = frames[frameIndex];
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                console.log(`Frame ${frameIndex + 1} drawn to canvas`);
            };
            img.onerror = (error) => {
                console.error(`Error loading frame ${frameIndex + 1}:`, error);
            };
            img.src = frame.dataUrl;
            
            frameIndex++;
        }, 500); // 500ms per frame (2 FPS)
        
    } catch (error) {
        console.error('Video creation error:', error);
        sendResponse({ ok: false, error: error.message });
    }
}
