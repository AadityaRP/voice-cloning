document.addEventListener("DOMContentLoaded", function () {
  let mediaRecorder;
  let audioChunks = [];
  let recordedBlob = null;
  let currentVoiceId = null;

  const startBtn = document.getElementById("startRecord");
  const stopBtn = document.getElementById("stopRecord");
  const cloneBtn = document.getElementById("cloneBtn");
  const generateBtn = document.getElementById("generateBtn");
  const recordStatus = document.getElementById("recordStatus");
  const cloneStatus = document.getElementById("cloneStatus");
  const generateStatus = document.getElementById("generateStatus");
  const recordedAudio = document.getElementById("recordedAudio");
  const generatedAudio = document.getElementById("generatedAudio");
  const recordingIndicator = document.getElementById("recordingIndicator");
  const audioFileInput = document.getElementById("audioFile");
  const fileNameDisplay = document.getElementById("fileName");

  // --- File Upload Display ---
  if (audioFileInput && fileNameDisplay) {
    audioFileInput.addEventListener("change", function (e) {
      const fileName = e.target.files[0] ? e.target.files[0].name : "Select an audio file";
      fileNameDisplay.textContent = fileName;
    });
  }

  // --- Record Button ---
  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        recordedBlob = null;
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
          if (recordedAudio) {
            recordedAudio.src = URL.createObjectURL(recordedBlob);
            recordedAudio.classList.remove("hidden");
          }
          setStatus(recordStatus, "Recording completed ✓", "success");
          if (recordingIndicator) {
            recordingIndicator.classList.add("hidden");
            recordingIndicator.classList.remove("animate-pulse");
          }
        };

        mediaRecorder.start();
        setStatus(recordStatus, "Recording...", "recording");
        if (recordingIndicator) {
          recordingIndicator.classList.remove("hidden");
          recordingIndicator.classList.add("animate-pulse");
        }
        startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
      } catch (error) {
        setStatus(recordStatus, "Microphone error: " + error.message, "error");
      }
    });
  }

  // --- Stop Button ---
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
        if (startBtn) startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    });
  }

  // --- Clone Voice Button ---
  if (cloneBtn) {
    cloneBtn.addEventListener("click", async () => {
      const voiceName = document.getElementById("voiceName")
        ? document.getElementById("voiceName").value.trim()
        : "";
      const fileInput = document.getElementById("audioFile");

      const formData = new FormData();
      formData.append("voice_name", voiceName || "Client Voice");

      if (recordedBlob) {
        formData.append("audio", recordedBlob, "recorded_voice.webm");
      } else if (fileInput && fileInput.files.length > 0) {
        formData.append("audio", fileInput.files[0]);
      } else {
        setStatus(cloneStatus, "⚠ Please record or upload audio first", "error");
        return;
      }

      setStatus(cloneStatus, "Cloning voice...", "loading");
      cloneBtn.disabled = true;

      try {
        const response = await fetch("/clone-voice", {
          method: "POST",
          body: formData
        });

        const data = await response.json();
        console.log("clone response:", data);

        if (!data.success) {
          setStatus(cloneStatus, "✗ Clone failed: " + (data.error || "Unknown error"), "error");
          return;
        }

        currentVoiceId = data.voice_id;
        setStatus(cloneStatus, `✓ Voice cloned! ID: ${currentVoiceId}`, "success");
      } catch (error) {
        setStatus(cloneStatus, "✗ Error: " + error.message, "error");
      } finally {
        cloneBtn.disabled = false;
      }
    });
  }

  // --- Generate Speech Button ---
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      const ttsText = document.getElementById("ttsText");
      const text = ttsText ? ttsText.value.trim() : "";

      if (!currentVoiceId) {
        setStatus(generateStatus, "⚠ Please clone a voice first", "error");
        return;
      }

      if (!text) {
        setStatus(generateStatus, "⚠ Please enter text to generate", "error");
        return;
      }

      setStatus(generateStatus, "Generating speech...", "loading");
      generateBtn.disabled = true;

      try {
        const response = await fetch("/generate-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voice_id: currentVoiceId, text: text })
        });

        const data = await response.json();
        console.log("generate response:", data);

        if (!data.success) {
          setStatus(generateStatus, "✗ Generation failed: " + (data.error || "Unknown error"), "error");
          return;
        }

        if (generatedAudio) {
          generatedAudio.src = data.audio_url;
          generatedAudio.load();
          generatedAudio.classList.remove("hidden");
        }
        setStatus(generateStatus, "✓ Speech generated successfully!", "success");
      } catch (error) {
        setStatus(generateStatus, "✗ Error: " + error.message, "error");
      } finally {
        generateBtn.disabled = false;
      }
    });
  }

  // --- Helper: set status text with color ---
  function setStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.style.color = type === "error" ? "#f87171" : type === "success" ? "#34d399" : "#a78bfa";
  }
});