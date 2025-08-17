const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

const recorded_chunks = [];
let media_recorder;
let current_media_stream; // Track the current media stream
let lastFrameData = null; // Store the last captured frame data
let lastFrameBounds = null; // Store the last frame bounds

chrome.runtime.onMessage.addListener(async (message) => {
  console.log("Offscreen document received message:", message);

  if (message.target === "offscreen") {
    switch (message.type) {
      case "mf-start-recording":
        await startRecording(
          message.stream_id,
          message.measurement,
          message.video_quality
        );
        break;
      case "mf-stop-recording":
        await stopRecording(message);
        break;
      case "test":
        console.log("Test message received successfully");
        break;
      default:
        console.warn("Unrecognized message type:", message.type);
    }
  }
});

async function startRecording(stream_id, measurement, video_quality) {
  if (media_recorder?.state === "recording") {
    throw new Error("Called startRecording while recording is in progress.");
  }

  // Clean up any existing resources
  if (current_media_stream) {
    current_media_stream.getTracks().forEach((track) => track.stop());
    current_media_stream = null;
  }

  if (media_recorder) {
    media_recorder = null;
  }

  // Clear video element
  video.srcObject = null;

  // Clear recorded chunks
  recorded_chunks.length = 0;

  window.location.hash = "recording";

  // For element capture, we'll use a different approach
  // We'll capture frames periodically and create a video stream
  if (measurement.useElementCapture) {
    startElementCapture(measurement, video_quality);
  } else {
    // Fallback to original tab capture method
    const media_stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: stream_id,
        },
      },
    });

    // Store reference to media stream for cleanup
    current_media_stream = media_stream;

    video.srcObject = media_stream;
    video.onloadedmetadata = () => {
      video.play();
      captureCanvasStream(measurement, video_quality);
    };
  }
}

async function startElementCapture(measurement, video_quality) {
  console.log("Starting element capture with measurement:", measurement);

  // Set up canvas for element capture
  canvas.width = measurement.width;
  canvas.height = measurement.height;

  // Fill canvas with initial content to ensure stream has data
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Starting recording...", canvas.width / 2, canvas.height / 2);

  let frameRate, mbps, max_aire;
  if (video_quality === "high") {
    mbps = 40000000;
    frameRate = 60;
    max_aire = 5000000;
  } else if (video_quality === "medium") {
    mbps = 25000000;
    frameRate = 30;
    max_aire = 2500000;
  } else {
    mbps = 10000000;
    frameRate = 15;
    max_aire = 1000000;
  }

  // Create a stream from the canvas
  const stream = canvas.captureStream(frameRate);
  console.log("Canvas stream created:", stream);
  console.log("Canvas stream tracks:", stream.getTracks());
  console.log("Canvas stream active:", stream.active);

  // Ensure the stream has video tracks
  if (stream.getVideoTracks().length === 0) {
    console.error("Canvas stream has no video tracks!");
    // Create a fallback stream with a simple animation
    const fallbackStream = canvas.captureStream(1);
    console.log("Fallback stream created:", fallbackStream);
    console.log("Fallback stream tracks:", fallbackStream.getTracks());
  }

  const options = {
    videoBitsPerSecond: mbps,
    frameRate,
  };

  if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
    options.mimeType = "video/webm;codecs=h264";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    options.mimeType = "video/webm;codecs=vp9";
  } else {
    options.mimeType = "video/webm";
  }

  console.log("MediaRecorder options:", options);
  media_recorder = new MediaRecorder(stream, options);

  media_recorder.ondataavailable = (event) => {
    console.log("MediaRecorder data available:", {
      size: event.data.size,
      type: event.data.type,
      timestamp: event.data.timestamp,
      totalChunks: recorded_chunks.length + 1,
    });
    if (event.data.size > 0) {
      recorded_chunks.push(event.data);
      console.log("Chunk added, total chunks:", recorded_chunks.length);
    } else {
      console.warn("Received empty chunk, size:", event.data.size);
    }
  };

  media_recorder.onerror = (event) => {
    console.error("MediaRecorder error:", event);
  };

  media_recorder.onstart = () => {
    console.log("MediaRecorder started");
  };

  media_recorder.onstop = () => {
    console.log("MediaRecorder stopped, chunks:", recorded_chunks.length);
  };

  // Start recording
  console.log("Starting MediaRecorder...");
  try {
    media_recorder.start(1000);
    console.log("MediaRecorder started successfully");
  } catch (error) {
    console.error("Failed to start MediaRecorder:", error);
  }

  // Start a fallback animation to ensure canvas always has content
  let animationFrame = 0;
  const animateCanvas = () => {
    // Draw a simple moving pattern to ensure the stream has data
    ctx.fillStyle = `hsl(${animationFrame % 360}, 50%, 50%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the current frame if available
    if (lastFrameData) {
      const img = new Image();
      img.onload = () => {
        const bounds = lastFrameBounds;
        if (bounds) {
          ctx.drawImage(
            img,
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        }
      };
      img.src = lastFrameData;
    } else {
      // If no frame data, draw a moving indicator
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        `Recording... Frame ${animationFrame}`,
        canvas.width / 2,
        canvas.height / 2
      );
    }

    animationFrame++;
    requestAnimationFrame(animateCanvas);
  };

  // Start the animation loop
  animateCanvas();

  // Request frame capture from background script
  chrome.runtime.sendMessage({
    type: "mf-request-frame-capture",
    tabId: measurement.tabId,
    frameRate: frameRate,
  });
}

// Handle incoming frame data from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "mf-frame-data" && message.target === "offscreen") {
    console.log("Received frame data:", {
      bounds: message.bounds,
      frameDataLength: message.frameData.length,
      canvasSize: `${canvas.width}x${canvas.height}`,
    });

    // Store the frame data and bounds for the animation loop
    lastFrameData = message.frameData;
    lastFrameBounds = message.bounds;

    // Draw the frame data to canvas, cropping to just the simulator frame
    const img = new Image();
    img.onload = () => {
      console.log("Frame image loaded, drawing to canvas...");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Crop the image to just the simulator frame area
      const bounds = message.bounds;
      if (bounds) {
        console.log("Drawing cropped frame:", bounds);
        ctx.drawImage(
          img,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height, // source rectangle (crop from full tab)
          0,
          0,
          canvas.width,
          canvas.height // destination rectangle (full canvas)
        );
        console.log("Frame drawn to canvas successfully");
      } else {
        console.log("No bounds, drawing full image");
        // Fallback: draw the full image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.onerror = (error) => {
      console.error("Error loading frame image:", error);
    };
    img.src = message.frameData;
  }
});

async function captureCanvasStream(measurement, video_quality) {
  let frameRate, mbps, max_aire;
  if (video_quality === "high") {
    mbps = 40000000;
    frameRate = 60;
    max_aire = 5000000;
  } else if (video_quality === "medium") {
    mbps = 25000000;
    frameRate = 30;
    max_aire = 2500000;
  } else {
    mbps = 10000000;
    frameRate = 15;
    max_aire = 1000000;
  }

  let devicePixelRatio = window.devicePixelRatio;
  let aspect_ratio_video = video.videoWidth / video.videoHeight;
  let aspect_ratio_window =
    measurement.window_width / measurement.window_height;

  let aire =
    measurement.height *
    devicePixelRatio *
    measurement.width *
    devicePixelRatio;
  let ratio = max_aire < aire ? Math.sqrt(max_aire / aire) : 1;

  let scale, calculated_top, calculated_left;
  if (aspect_ratio_window < aspect_ratio_video) {
    scale = video.videoHeight / (measurement.window_height * devicePixelRatio);
    calculated_top = scale * measurement.top * devicePixelRatio;
    calculated_left =
      (video.videoWidth - scale * measurement.window_width * devicePixelRatio) /
        2 +
      scale * measurement.left * devicePixelRatio;
  } else {
    scale = video.videoWidth / (measurement.window_width * devicePixelRatio);
    calculated_top =
      (video.videoHeight -
        scale * measurement.window_height * devicePixelRatio) /
        2 +
      scale * measurement.top * devicePixelRatio;
    calculated_left = scale * measurement.left * devicePixelRatio;
  }

  canvas.width =
    scale * measurement.width * devicePixelRatio * ratio + 1 * devicePixelRatio;
  canvas.height = scale * measurement.height * devicePixelRatio * ratio;

  ctx.scale(ratio, ratio);

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let width = (canvas.width * 1) / ratio;
  let height = (canvas.height * 1) / ratio;

  (function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      video,
      calculated_left,
      calculated_top,
      width,
      height,
      0,
      0,
      width,
      height
    );
    setTimeout(loop, 1000 / frameRate);
  })();

  const stream = canvas.captureStream(frameRate);

  const options = {
    videoBitsPerSecond: mbps,
    frameRate,
  };

  if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
    options.mimeType = "video/webm;codecs=h264";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    options.mimeType = "video/webm;codecs=vp9";
  } else {
    options.mimeType = "video/webm";
  }

  media_recorder = new MediaRecorder(stream, options);

  media_recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recorded_chunks.push(event.data);
    }
  };

  // Start recording
  media_recorder.start(1000);
}

async function stopRecording(message) {
  console.log("=== STOP RECORDING DEBUG ===");
  console.log("MediaRecorder state:", media_recorder?.state);
  console.log("Recorded chunks count:", recorded_chunks.length);
  console.log("Recorded chunks details:", recorded_chunks);

  // Stop the media recorder and wait until fully stopped
  if (media_recorder && media_recorder.state === "recording") {
    console.log("Stopping MediaRecorder...");
    await new Promise((resolve) => {
      media_recorder.onstop = () => {
        console.log("MediaRecorder stopped event fired");
        resolve();
      };
      media_recorder.stop();
    });
    console.log("MediaRecorder fully stopped");
  }

  // Stop all tracks from the canvas stream
  if (media_recorder && media_recorder.stream) {
    console.log("Stopping canvas stream tracks...");
    media_recorder.stream.getTracks().forEach((track) => track.stop());
  }

  // Stop the media stream from getUserMedia
  if (current_media_stream) {
    console.log("Stopping getUserMedia tracks...");
    current_media_stream.getTracks().forEach((track) => track.stop());
    current_media_stream = null;
  }

  // Clear video element
  video.srcObject = null;

  // Check chunks before creating blob
  console.log("Chunks before blob creation:", recorded_chunks.length);
  recorded_chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index}:`, {
      size: chunk.size,
      type: chunk.type,
      timestamp: chunk.timestamp,
    });
  });

  // ✅ NOW build blob with collected chunks (before clearing them!)
  const blob = new Blob(recorded_chunks, { type: "video/webm" });
  console.log("Blob created:", {
    size: blob.size,
    type: blob.type,
  });

  let url = window.URL.createObjectURL(blob);
  console.log("Blob URL created:", url);

  // Send to background script for download
  console.log("Sending video to background script...");
  chrome.runtime.sendMessage({
    action: "tab_capture_video_generated",
    tabId: message.tabId,
    url,
  });

  // ✅ Only clear chunks AFTER creating the blob
  recorded_chunks.length = 0;

  // Reset media recorder
  media_recorder = null;

  window.location.hash = "";
  console.log("=== STOP RECORDING COMPLETE ===");
}
