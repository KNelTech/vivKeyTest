function getKeySelector(keyCode) {
  return `.key.${keyCode}`;
}
//go over this section closely,
function updateElementClass(selector, className, action) {
  const element = document.querySelector(selector);
  if (element) {
    if (action === "add") {
      element.classList.add(className);
    } else if (action === "remove") {
      element.classList.remove(className);
    }
  } else {
    console.error(`Element with selector "${selector}" not found.`);
  }
}

document.addEventListener("keydown", function (e) {
  e.preventDefault();
  const keySelector = getKeySelector(e.code);
  updateElementClass(keySelector, "active", "add");
  updateElementClass(keySelector, "secondary-highlight", "add");
  console.log(`Key pressed: ${e.key}`);
});

document.addEventListener("keyup", function (e) {
  const keySelector = getKeySelector(e.code);
  updateElementClass(keySelector, "secondary-highlight", "remove");
});

document.addEventListener("mousedown", function (e) {
  const mouseSelector = `.key.Mouse${e.button}`;
  updateElementClass(mouseSelector, "active", "add");
  updateElementClass(mouseSelector, "secondary-highlight", "add");
});

document.addEventListener("mouseup", function (e) {
  const mouseSelector = `.key.Mouse${e.button}`;
  updateElementClass(mouseSelector, "secondary-highlight", "remove");
  // Keep the "active" class for all mouse buttons
});

document.addEventListener("contextmenu", function (e) {
  e.preventDefault(); // Prevent the context menu from appearing
  const mouseSelector = `.key.Mouse${e.button}`;
  // Only remove the secondary highlight for the right mouse button
  updateElementClass(mouseSelector, "secondary-highlight", "remove");
  // Keep the "active" class
});

window.addEventListener(
  "wheel",
  function (e) {
    const scrollSelector = e.deltaY > 0 ? ".scrollDown" : ".scrollUp";
    // Add the regular "active" highlight
    updateElementClass(scrollSelector, "active", "add");
    // Add the secondary highlight
    updateElementClass(scrollSelector, "secondary-highlight", "add");

    // Remove the secondary highlight after a brief timeout
    setTimeout(() => {
      updateElementClass(scrollSelector, "secondary-highlight", "remove");
    }, 200); // Adjust the timeout duration as needed
  },
  { passive: false }
);

//end Highlightblock

document.addEventListener("DOMContentLoaded", function () {
  window.addEventListener("resize", debounce(handleResize, 10)); // Debounce the resize event
  handleResize(); // Initial resizing
});

/*
 **  Resizes the keyboard to fit the window.
 */
function handleResize() {
  try {
    // Get the width of the keyboard container
    const keyboardWrapper = document.getElementById("kbContainer");
    const keyboardBody = document.getElementById("kbLayout");

    if (!keyboardWrapper || !keyboardBody) {
      console.warn("Keyboard elements not found.");
      return;
    }

    // Get the width of the window
    const myWidth = keyboardBody.clientWidth;
    const windowWidth = document.documentElement.clientWidth;

    if (isNaN(myWidth) || isNaN(windowWidth) || windowWidth === 0) {
      console.error("Invalid dimensions.");
      return;
    }

    // Scale the keyboard
    const myPercentage = myWidth / windowWidth;
    if (myPercentage > 1) {
      const newPercentage = Math.min(0.95, (windowWidth / myWidth) * 0.95);
      scaleKeyboard(keyboardWrapper, newPercentage);
    } else {
      scaleKeyboard(keyboardWrapper, 1); // Reset scaling if not needed
    }
  } catch (error) {
    console.error("Error handling resize:", error);
  }
}

function scaleKeyboard(element, percentage) {
  element.style.transform = `scale(${percentage})`; // Scale and translate the element
}

function debounce(func, delay) {
  let timeoutId;
  return function () {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(func, delay);
  };
}

/*
 **  Webcam
 */
const video = document.getElementById("video");

function webcamAccess() {
  // Ensure the video element exists
  const video = document.getElementById("video");
  if (!video) {
    console.error("Video element not found.");
    return;
  }

  // Check if getUserMedia method is available
  if (
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  ) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream;
        video.play().catch(function (playError) {
          // Handle potential errors that might occur when trying to play the video
          console.error("Error attempting to play video:", playError);
        });
        video.style.display = "block"; // Only display the video element if access is granted
        console.log("Webcam access granted.");
      })
      .catch(function (error) {
        showAlert({ message: "Error finding webcam. did you allow access?" });
        console.error("Error accessing webcam:", error);
      });
  } else {
    console.error("getUserMedia not supported by this browser.");
  }
}

const webcamTest = document.getElementById("webcamTest");
webcamTest.addEventListener("click", function () {
  webcamAccess();
});

// Cleanup webcam when done
window.addEventListener("beforeunload", function () {
  const stream = video.srcObject;
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
  }
});

/*
 **  Recording
 */
const audioRecord = document.getElementById("audioRecord");
const startRecordingButton = document.getElementById("startRecording");
const stopRecordingButton = document.getElementById("stopRecording");
let mediaRecorder;
let recordedChunks = [];

function setupMediaRecorder(stream) {
  recordedChunks = [];

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.addEventListener("dataavailable", (e) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  });

  mediaRecorder.addEventListener("stop", () => {
    const recordedBlob = new Blob(recordedChunks, { type: "audio/wav" });
    const recordedUrl = URL.createObjectURL(recordedBlob);

    replaceAudioElement(recordedUrl);
  });

  mediaRecorder.start();
  console.log("Audio recording in progress...");
}

/**
 * Replaces the source URL of the audio element and sets its display style to block.
 *
 * @param {string} srcUrl - The new source URL for the audio element.
 */
function replaceAudioElement(srcUrl) {
  audioRecord.src = srcUrl;
  audioRecord.style.display = "block";
  console.log("Audio recording finished.");
}

// Asynchronously handles microphone recording by accessing the device's media stream,
// setting up the media recorder, and updating the recording status display.
async function handleMicRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (stream) {
      console.log("Microphone access granted.");
      setupMediaRecorder(stream);
      recordingStatus.style.display = "block";
      audioRecord.style.display = "none";
    } else {
      console.error("Failed to get microphone stream.");
    }
  } catch (error) {
    showAlert({ message: "Error finding microphone. did you allow access?" });
    console.error("Error accessing microphone:", error);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    recordingStatus.style.display = "none";
  }
}

startRecordingButton.addEventListener("click", handleMicRecording);
stopRecordingButton.addEventListener("click", stopRecording);

// Theme Selector
const themeSelector = document.getElementById("themeSelector");

const themes = [
  { value: "", text: "Default Theme" },
  { value: "basicTheme", text: "Basic Theme" },
];

themes.forEach((theme) => {
  const option = document.createElement("option");
  option.value = theme.value;
  option.textContent = theme.text;
  themeSelector.appendChild(option);
});

function handleThemeChange() {
  const selectedTheme = this.value;
  const htmlElement = document.documentElement;

  themes.forEach((theme) => {
    if (theme.value) {
      htmlElement.classList.remove(theme.value);
    }
  });

  if (selectedTheme) {
    htmlElement.classList.add(selectedTheme);
  }
}
themeSelector.addEventListener("change", handleThemeChange);

console.log(
  "%cHello there!  If you see this message, know that you are awesome!",
  "background: #222; color: #bb55da; font-size: 20px; padding: 8px; border-radius: 15px;"
);
