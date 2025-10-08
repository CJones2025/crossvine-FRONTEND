// Media Management System

// Compress image files to reduce storage size
function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = function () {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

      console.log(
        `Compressed ${file.name}: ${file.size} bytes -> ${compressedDataUrl.length} chars`
      );
      resolve(compressedDataUrl);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Handle media file selection
async function handleMediaUpload(input, previewContainer) {
  const files = Array.from(input.files);

  console.log(
    "Processing files:",
    files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
  );

  // Check storage space before processing
  if (!checkStorageSpace()) {
    console.warn(
      "Storage space is running low. Please delete some old posts or use smaller files."
    );
    return;
  }

  for (const file of files) {
    try {
      console.log(`Processing file: ${file.name}, type: ${file.type}`);

      // Limit file size (10MB for videos/audio, 5MB for images)
      const maxSize = file.type.startsWith("image/")
        ? 5 * 1024 * 1024
        : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        console.warn(
          `File ${file.name} is too large. Maximum size: ${
            maxSize / 1024 / 1024
          }MB`
        );
        continue;
      }

      // Check file type by MIME type and extension
      const isImage =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);
      const isVideo =
        file.type.startsWith("video/") ||
        /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(file.name);
      const isAudio =
        file.type.startsWith("audio/") ||
        /\.(mp3|wav|ogg|m4a|aac|flac|wma|opus)$/i.test(file.name);

      console.log(
        `File ${file.name}: isImage=${isImage}, isVideo=${isVideo}, isAudio=${isAudio}`
      );

      if (!isImage && !isVideo && !isAudio) {
        console.warn(
          `Unsupported file type: ${file.type} for file: ${file.name}`
        );
        console.warn(`Unsupported file type: ${file.type}`);
        return;
      }

      let fileData;

      if (isImage) {
        // Compress images to save storage space
        fileData = await compressImage(file);
      } else {
        // For video/audio, use original data but warn about size
        const reader = new FileReader();
        fileData = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) =>
            reject(new Error(`Failed to read file: ${e.target.error}`));
          reader.readAsDataURL(file);
        });
      }

      const mediaItem = document.createElement("div");
      mediaItem.className = "media-item";

      let mediaContent = "";
      let customNameInput = "";
      let displayName = file.name;

      if (isImage) {
        mediaContent = `<img src="${fileData}" alt="${file.name}">`;
      } else if (isVideo) {
        mediaContent = `<div class="media-player-wrapper"><video src="${fileData}" controls class="post-video"></video></div>`;
        customNameInput = `<input type="text" class="custom-name-input" placeholder="Enter video name..." value="${file.name.replace(
          /\.[^/.]+$/,
          ""
        )}">`;
      } else if (isAudio) {
        console.log(
          `Processing audio file: ${file.name}, size: ${file.size} bytes`
        );
        mediaContent = `<div class="media-player-wrapper"><audio src="${fileData}" controls class="post-audio"></audio></div>`;
        customNameInput = `<input type="text" class="custom-name-input" placeholder="Enter audio name..." value="${file.name.replace(
          /\.[^/.]+$/,
          ""
        )}">`;
      }

      mediaItem.innerHTML = `
        ${mediaContent}
        <div class="file-info">
          ${customNameInput || `<span class="file-name">${file.name}</span>`}
        </div>
        <button class="media-remove" onclick="removeMediaItem(this)">×</button>
      `;

      // Store file data for posting
      mediaItem.dataset.fileData = fileData;
      mediaItem.dataset.fileName = file.name;
      mediaItem.dataset.fileType = file.type;

      previewContainer.appendChild(mediaItem);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      alert(`Error processing file ${file.name}: ${error.message}`);
    }
  }

  // Clear the input
  input.value = "";
}

// Remove media item from preview
function removeMediaItem(button) {
  const mediaItem = button.closest(".media-item");
  mediaItem.remove();
}

// Get media data from preview container
function getMediaData(previewContainer) {
  if (!previewContainer) return [];

  const mediaItems = previewContainer.querySelectorAll(".media-item");
  return Array.from(mediaItems).map((item) => {
    let displayName = item.dataset.fileName;

    // Check for custom name input
    const customNameInput = item.querySelector(".custom-name-input");
    if (customNameInput && customNameInput.value.trim()) {
      displayName = customNameInput.value.trim();
    }

    return {
      data: item.dataset.fileData,
      name: displayName,
      originalName: item.dataset.fileName,
      type: item.dataset.fileType,
    };
  });
}

// Initialize all custom audio players in the document
// NOTE: These custom audio player functions are currently unused but preserved for future enhancements
function initializeAllAudioPlayers() {
  const playButtons = document.querySelectorAll(".play-pause-btn");
  const progressBars = document.querySelectorAll(".progress-bar");

  playButtons.forEach((button) => {
    const audioId = button.dataset.audioId;
    const audio = document.getElementById(audioId);

    if (audio && !button.dataset.initialized) {
      setupAudioPlayer(audio, button);
      button.dataset.initialized = "true";
    }
  });

  progressBars.forEach((bar) => {
    const audioId = bar.dataset.audioId;
    const audio = document.getElementById(audioId);

    if (audio && !bar.dataset.initialized) {
      setupProgressBar(audio, bar);
      bar.dataset.initialized = "true";
    }
  });
}

// Setup individual audio player controls
function setupAudioPlayer(audio, playButton) {
  const container = playButton.closest(".audio-player-container");
  const currentTimeEl = container.querySelector(".current-time");
  const totalTimeEl = container.querySelector(".total-time");
  const progressFill = container.querySelector(".progress-fill");

  let isPlaying = false;

  // Play/Pause functionality
  playButton.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
      playButton.textContent = "▶️";
      isPlaying = false;
    } else {
      // Pause other audio players
      document.querySelectorAll(".hidden-audio").forEach((otherAudio) => {
        if (otherAudio !== audio) {
          otherAudio.pause();
        }
      });
      document.querySelectorAll(".play-pause-btn").forEach((otherBtn) => {
        if (otherBtn !== playButton) {
          otherBtn.textContent = "▶️";
        }
      });

      audio.play();
      playButton.textContent = "⏸️";
      isPlaying = true;
    }
  });

  // Update duration when loaded
  audio.addEventListener("loadedmetadata", () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });

  // Update progress during playback
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = progress + "%";
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  });

  // Handle end of playback
  audio.addEventListener("ended", () => {
    playButton.textContent = "▶️";
    isPlaying = false;
    progressFill.style.width = "0%";
    currentTimeEl.textContent = "0:00";
  });
}

// Setup progress bar clicking
function setupProgressBar(audio, progressBar) {
  progressBar.addEventListener("click", (e) => {
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  });
}

// Format time helper function
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
