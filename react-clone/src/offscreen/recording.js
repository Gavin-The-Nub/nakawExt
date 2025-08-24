// Offscreen recording functionality
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let timerInterval = null;
let currentStream = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, streamId, mockupBounds } = message;

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
                isRecording: mediaRecorder && mediaRecorder.state === "recording",
                duration: getRecordingDuration()
            });
            break;
        case "PING":
            // Simple ping to check if offscreen page is ready
            sendResponse({ ok: true, ready: true });
            break;
    }
    return true; // Keep message channel open for async responses
});

function startRecording(mockupBounds) {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("Already recording");
        return;
    }

    // Create a canvas to capture the mockup area
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match the mockup frame
    canvas.width = mockupBounds.frame.width;
    canvas.height = mockupBounds.frame.height;
    
    // Start recording using canvas capture
    startCanvasRecording(canvas, ctx, mockupBounds);
}

function startCanvasRecording(canvas, ctx, mockupBounds) {
    recordedChunks = [];
    recordingStartTime = Date.now();
    
    // Create MediaRecorder with canvas stream
    const canvasStream = canvas.captureStream(30); // 30 FPS
    mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 // 8 Mbps for high quality
    });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        downloadRecording(blob);
        cleanup();
    };

    mediaRecorder.onerror = (event) => {
        console.error("Recording error:", event.error);
        updateStatus("Recording error: " + event.error.message);
        cleanup();
    };

    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    startTimer();
    updateStatus("Recording...");
    updateRecordButton(true);
    
    // Start drawing frames to canvas using tab capture
    function drawFrame() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            // Capture the current tab
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error("Tab capture error:", chrome.runtime.lastError);
                    return;
                }
                
                if (dataUrl) {
                    // Create an image from the captured data
                    const img = new Image();
                    img.onload = () => {
                        // Clear canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        // Draw the mockup area from the captured image
                        const { frame, screen } = mockupBounds;
                        
                        // Calculate the source rectangle in the captured image
                        const imgAspectRatio = img.width / img.height;
                        const frameAspectRatio = frame.width / frame.height;
                        
                        let sx, sy, sw, sh;
                        if (imgAspectRatio > frameAspectRatio) {
                            // Image is wider than frame
                            sw = img.height * frameAspectRatio;
                            sh = img.height;
                            sx = (img.width - sw) / 2;
                            sy = 0;
                        } else {
                            // Image is taller than frame
                            sw = img.width;
                            sh = img.width / frameAspectRatio;
                            sx = 0;
                            sy = (img.height - sh) / 2;
                        }
                        
                        // Draw the mockup area to canvas
                        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                        
                        // Request next frame
                        requestAnimationFrame(drawFrame);
                    };
                    img.src = dataUrl;
                }
            });
        }
    }
    
    drawFrame();
    
    // Notify background script that recording started
    chrome.runtime.sendMessage({
        type: "RECORDING_STARTED"
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        updateStatus("Processing recording...");
        updateRecordButton(false);
        stopTimer();
    }
}

function downloadRecording(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockup-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL after a delay
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
    
    updateStatus("Recording downloaded successfully!");
    
    // Notify background script that recording completed
    chrome.runtime.sendMessage({
        type: "RECORDING_COMPLETED"
    });
}

function cleanup() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    // Remove canvas if it exists
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.remove();
    }
    
    mediaRecorder = null;
    recordedChunks = [];
    recordingStartTime = null;
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
    document.getElementById('statusText').textContent = text;
}

function updateRecordButton(isRecording) {
    const btn = document.getElementById('recordBtn');
    if (isRecording) {
        btn.textContent = 'Stop Recording';
        btn.classList.add('recording');
    } else {
        btn.textContent = 'Start Recording';
        btn.classList.remove('recording');
    }
}

// Handle manual button clicks (for testing)
document.getElementById('recordBtn').addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        stopRecording();
    } else {
        // This would normally be triggered by the background script
        updateStatus("Click the record button in the toolbar to start recording");
    }
});

// Initialize
updateStatus("Ready to record");
updateRecordButton(false);
