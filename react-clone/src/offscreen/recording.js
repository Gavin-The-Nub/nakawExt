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
let videoEl = null;
let drawLoopCancel = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, stream: streamData, mockupBounds: bounds } = message;

  switch (type) {
    case "START_FRAME_RECORDING":
      startFrameRecording(bounds);
      sendResponse({ ok: true });
      break;
    case "START_TAB_RECORDING":
      startTabRecording(message.streamId, bounds)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => {
          console.error("START_TAB_RECORDING error", err);
          sendResponse({ ok: false, error: err?.message || String(err) });
        });
      return true;
    case "TAB_CAPTURE_STREAM":
      startRecordingWithStream(streamData, bounds);
      sendResponse({ ok: true });
      break;
    case "STOP_RECORDING":
      stopRecording();
      sendResponse({ ok: true });
      break;
    case "GET_RECORDING_STATUS":
      const response = {
        isRecording: isRecording,
        duration: getRecordingDuration(),
        chunks: recordedChunks.length,
      };

      // Include video blob if available
      if (window.recordedVideoBlob && !isRecording) {
        response.videoBlob = window.recordedVideoBlob;
      }

      sendResponse(response);
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

async function startTabRecording(streamId, bounds) {
  if (isRecording) {
    return;
  }

  mockupBounds = bounds;
  isRecording = true;
  recordedChunks = [];
  recordingStartTime = Date.now();
  startTimer();
  updateStatus("Recording... (Tab capture active)");
  updateRecordButton(true);

  // Acquire the tab media stream using the provided streamId
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  });
  tabStream = mediaStream;

  // Prepare canvas and video elements
  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d", { alpha: false });

  videoEl = document.createElement("video");
  videoEl.srcObject = mediaStream;
  videoEl.muted = true;
  videoEl.playsInline = true;

  await new Promise((resolve) => {
    videoEl.onloadedmetadata = () => {
      videoEl.play().then(resolve).catch(resolve);
    };
  });

  // Determine crop from mockupBounds.frame if present
  const frame = mockupBounds && mockupBounds.frame ? mockupBounds.frame : null;
  const page = mockupBounds && mockupBounds.page ? mockupBounds.page : null;

  const targetFps = 60;

  function computeCanvasSize() {
    const srcW = videoEl.videoWidth;
    const srcH = videoEl.videoHeight;
    if (!frame) {
      canvas.width = srcW;
      canvas.height = srcH;
      return {
        sx: 0,
        sy: 0,
        sw: srcW,
        sh: srcH,
        dx: 0,
        dy: 0,
        dw: srcW,
        dh: srcH,
      };
    }
    // Map frame coords (already in device pixels) to stream resolution
    let fx = frame.x,
      fy = frame.y,
      fw = frame.width,
      fh = frame.height;
    // If page metrics exist, adjust in case capture/video resolution differs
    if (page && page.cssWidth && page.cssHeight) {
      const scaleX = srcW / Math.round(page.cssWidth * (page.dpr || 1));
      const scaleY = srcH / Math.round(page.cssHeight * (page.dpr || 1));
      fx = Math.round(fx * scaleX);
      fy = Math.round(fy * scaleY);
      fw = Math.round(fw * scaleX);
      fh = Math.round(fh * scaleY);
    }
    canvas.width = fw;
    canvas.height = fh;
    return {
      sx: fx,
      sy: fy,
      sw: fw,
      sh: fh,
      dx: 0,
      dy: 0,
      dw: fw,
      dh: fh,
    };
  }

  let drawParams = computeCanvasSize();

  const draw = () => {
    if (!isRecording || !ctx || !canvas || !videoEl) return;
    ctx.drawImage(
      videoEl,
      drawParams.sx,
      drawParams.sy,
      drawParams.sw,
      drawParams.sh,
      drawParams.dx,
      drawParams.dy,
      drawParams.dw,
      drawParams.dh
    );
  };

  // High-FPS draw loop
  let animationHandle;
  const loop = () => {
    draw();
    animationHandle = setTimeout(loop, Math.floor(1000 / targetFps));
  };
  loop();
  drawLoopCancel = () => clearTimeout(animationHandle);

  // Create stream from canvas and start MediaRecorder
  stream = canvas.captureStream(targetFps);
  const mimeType = getSupportedMimeType();
  if (!mimeType) {
    updateStatus("Error: No supported video format found");
    stopRecording();
    return;
  }

  try {
    mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 25000000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      if (recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        notifyRecordingCompleted(videoBlob, mimeType);
      } else {
        updateStatus("No video data recorded");
      }
    };
    mediaRecorder.onerror = (event) => {
      updateStatus("Recording error: " + event.error?.message);
      stopRecording();
    };

    mediaRecorder.start(100);
  } catch (e) {
    updateStatus("Error starting recording: " + e.message);
    stopRecording();
  }
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
      videoBitsPerSecond: 8000000, // 8 Mbps for high quality
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log("Video chunk recorded:", event.data.size, "bytes");
      } else {
        console.warn("Empty video chunk received");
      }
    };

    mediaRecorder.onstop = () => {
      console.log("MediaRecorder stopped, chunks:", recordedChunks.length);
      if (recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        console.log("Video blob created:", videoBlob.size, "bytes");
        // Use helper to send as base64
        notifyRecordingCompleted(videoBlob, mimeType);
      } else {
        console.error("No video data recorded");
        updateStatus("No video data recorded");
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error);
      updateStatus("Recording error: " + event.error.message);
      stopRecording();
    };

    // Start recording with high frame rate
    mediaRecorder.start(50); // Collect data every 50ms for 60 FPS recording
    console.log("MediaRecorder started with MIME type:", mimeType);

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
  canvas = document.createElement("canvas");
  canvas.width = 1080; // Optimized for mobile mockups
  canvas.height = 1920; // Portrait orientation (height > width)
  ctx = canvas.getContext("2d");

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
      videoBitsPerSecond: 8000000, // 8 Mbps for high quality
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log("Video chunk recorded:", event.data.size, "bytes");
      } else {
        console.warn("Empty video chunk received");
      }
    };

    mediaRecorder.onstop = () => {
      console.log("MediaRecorder stopped, chunks:", recordedChunks.length);
      if (recordedChunks.length > 0) {
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        console.log("Video blob created:", videoBlob.size, "bytes");
        // Use helper to send as base64
        notifyRecordingCompleted(videoBlob, mimeType);
      } else {
        console.error("No video data recorded");
        updateStatus("No video data recorded");
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error);
      updateStatus("Recording error: " + event.error.message);
      stopRecording();
    };

    // Start recording
    mediaRecorder.start(50); // Collect data every 50ms for 60 FPS
    console.log("MediaRecorder started with MIME type:", mimeType);
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
  chrome.runtime.sendMessage(
    {
      type: "CAPTURE_FRAME",
    },
    (response) => {
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
    }
  );
}

function drawTestPattern() {
  if (!ctx || !canvas) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw a test pattern to verify canvas is working
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw some test shapes
  ctx.fillStyle = "#3498db";
  ctx.fillRect(100, 100, 200, 200);

  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(400, 300, 100, 0, 2 * Math.PI);
  ctx.fill();

  // Add text
  ctx.fillStyle = "#ffffff";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Canvas Test Pattern", canvas.width / 2, 600);
  ctx.fillText("Mockup Recording", canvas.width / 2, 700);

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
  let { x, y, width, height } = bounds;
  const page = mockupBounds.page || null;

  // If we know the page css size and DPR, remap to image pixel space
  if (page && page.cssWidth && page.cssHeight && page.dpr) {
    // The captured frame (img) resolution corresponds to the tab capture resolution.
    // Estimate ratios between what content sent and the actual image dimensions.
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const expectedPxW = Math.round(page.cssWidth * page.dpr);
    const expectedPxH = Math.round(page.cssHeight * page.dpr);
    if (expectedPxW > 0 && expectedPxH > 0 && imgW > 0 && imgH > 0) {
      const scaleX = imgW / expectedPxW;
      const scaleY = imgH / expectedPxH;
      x = Math.round(x * scaleX);
      y = Math.round(y * scaleY);
      width = Math.round(width * scaleX);
      height = Math.round(height * scaleY);
    }
  }

  console.log("Cropping frame to mockup area:", { x, y, width, height });
  console.log("Canvas dimensions:", {
    width: canvas.width,
    height: canvas.height,
  });

  // Calculate scaling to fit mockup area to canvas
  const scaleX = canvas.width / width;
  const scaleY = canvas.height / height;
  const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

  // Calculate centered position
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = (canvas.width - scaledWidth) / 2;
  const offsetY = (canvas.height - scaledHeight) / 2;

  console.log("Scaling info:", {
    scale,
    scaledWidth,
    scaledHeight,
    offsetX,
    offsetY,
  });

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw only the cropped mockup area, scaled to fit canvas
  ctx.drawImage(
    img, // Source image
    x,
    y,
    width,
    height, // Source rectangle (crop area)
    offsetX,
    offsetY, // Destination position (centered)
    scaledWidth,
    scaledHeight // Destination size (scaled)
  );
}

function getSupportedMimeType() {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
    "video/ogg",
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
  if (drawLoopCancel) {
    try {
      drawLoopCancel();
    } catch (e) {}
    drawLoopCancel = null;
  }

  // Stop timer
  stopTimer();

  updateStatus("Processing recording...");
  updateRecordButton(false);

  // Stop MediaRecorder if it's recording
  if (mediaRecorder && mediaRecorder.state === "recording") {
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
      tabStream.getTracks().forEach((track) => track.stop());
      console.log("Tab capture stream stopped");
    } catch (error) {
      console.error("Error stopping tab stream:", error);
    }
    tabStream = null;
  }

  // Stop canvas stream if it exists
  if (stream) {
    try {
      stream.getTracks().forEach((track) => track.stop());
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
  videoEl = null;
}

function downloadVideo(videoBlob) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const extension = videoBlob.type.includes("webm")
    ? "webm"
    : videoBlob.type.includes("mp4")
    ? "mp4"
    : "ogg";
  const filename = `mockup-recording-${timestamp}.${extension}`;

  const url = URL.createObjectURL(videoBlob);
  const a = document.createElement("a");
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
    type: "OFFSCREEN_RECORDING_COMPLETED",
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
  const timerElement = document.getElementById("timer");
  if (timerElement) {
    timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
}

function getRecordingDuration() {
  if (!recordingStartTime) return 0;
  return Math.floor((Date.now() - recordingStartTime) / 1000);
}

function updateStatus(text) {
  const statusElement = document.getElementById("statusText");
  if (statusElement) {
    statusElement.textContent = text;
  }
  console.log("Status:", text);
}

function updateRecordButton(isRecording) {
  const btn = document.getElementById("recordBtn");
  if (btn) {
    if (isRecording) {
      btn.textContent = "Stop Recording";
      btn.classList.add("recording");
    } else {
      btn.textContent = "Start Recording";
      btn.classList.remove("recording");
    }
  }
}

function notifyRecordingCompleted(videoBlob, mimeType) {
  // Convert blob to base64 string for message passing
  const reader = new FileReader();
  reader.onload = () => {
    const base64Data = reader.result.split(",")[1]; // Remove data:video/webm;base64, prefix
    // Notify background script that recording completed
    chrome.runtime.sendMessage({
      type: "OFFSCREEN_RECORDING_COMPLETED",
      videoBlob: {
        base64Data: base64Data,
        type: mimeType,
        size: videoBlob.size,
      },
    });
  };
  reader.onerror = (error) => {
    console.error("Failed to convert blob to base64:", error);
    // Send message without video data
    chrome.runtime.sendMessage({
      type: "OFFSCREEN_RECORDING_COMPLETED",
      videoBlob: null,
    });
  };
  reader.readAsDataURL(videoBlob);
}

// Handle manual button clicks (for testing)
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("recordBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      if (isRecording) {
        stopRecording();
      } else {
        updateStatus(
          "Click the record button in the toolbar to start recording"
        );
      }
    });
  }

  // Initialize
  updateStatus("Ready to record (Tab Capture + MediaRecorder)");
  updateRecordButton(false);
});
