import "./style.css";
import "./app.css";

import logo from "./assets/images/logo-universal.png";
import {
  Connect,
  SetColor,
  Off,
  CheckDependencies,
  InstallDependencies,
  GetUSBDevices,
  LoadSettings,
  SaveColorSetting,
} from "../wailsjs/go/main/App";

document.querySelector("#app").innerHTML = `
    <div class="container">
        <h1>HyperX QuadCast RGB Controller</h1>
        
        <div id="status" class="status">Checking dependencies...</div>
        
        <button id="connectBtn" class="btn btn-primary" onclick="connect()" style="display: none;">
            Connect Device
        </button>
        
        <button id="installBtn" class="btn btn-warning" onclick="installDeps()" style="display: none;">
            Install Dependencies Automatically
        </button>
        
        <button id="debugBtn" class="btn btn-secondary" onclick="showDebugInfo()" style="display: none;">
            🔍 Show USB Devices (Debug)
        </button>
        
        <div id="controls" class="controls" style="display: none;">
            <div class="color-picker-container">
                <label for="colorPicker">Choose color:</label>
                <input type="color" id="colorPicker" value="#ff0000" />
            </div>
            
            <div class="preset-colors">
                <button class="color-preset" style="background: #ff0000" onclick="setColorFromHex('#ff0000')"></button>
                <button class="color-preset" style="background: #00ff00" onclick="setColorFromHex('#00ff00')"></button>
                <button class="color-preset" style="background: #0000ff" onclick="setColorFromHex('#0000ff')"></button>
                <button class="color-preset" style="background: #ffff00" onclick="setColorFromHex('#ffff00')"></button>
                <button class="color-preset" style="background: #ff00ff" onclick="setColorFromHex('#ff00ff')"></button>
                <button class="color-preset" style="background: #00ffff" onclick="setColorFromHex('#00ffff')"></button>
                <button class="color-preset" style="background: #ffffff" onclick="setColorFromHex('#ffffff')"></button>
            </div>
            
            <button class="btn btn-danger" onclick="turnOff()">
                Turn Off LED
            </button>
        </div>
    </div>
`;

// Flag to prevent recursive calls
let isUpdatingProgrammatically = false;

// Debounce timer for saving color
let saveColorTimeout = null;

// Check dependencies on load
window.addEventListener("DOMContentLoaded", async () => {
  await checkDeps();

  // Color picker event listener
  const colorPicker = document.getElementById("colorPicker");
  if (colorPicker) {
    colorPicker.addEventListener("input", (e) => {
      if (!isUpdatingProgrammatically) {
        setColorFromHex(e.target.value);
      }
    });
  }
});

async function checkDeps() {
  const statusEl = document.getElementById("status");
  const connectBtn = document.getElementById("connectBtn");
  const installBtn = document.getElementById("installBtn");

  try {
    const result = await CheckDependencies();

    if (result.installed) {
      statusEl.textContent = "✅ " + result.message;
      statusEl.className = "status status-connected";
      // Automatically connect to device
      await connect();
    } else {
      statusEl.innerHTML = `
        <div style="text-align: left; font-size: 14px;">
          <strong>⚠️ Dependencies installation required</strong><br/>
          <br/>
          ${result.message.replace(/\n/g, "<br/>")}
        </div>
      `;
      statusEl.className = "status status-warning";

      // Show automatic installation button if Homebrew is available
      if (!result.message.includes("Homebrew")) {
        installBtn.style.display = "block";
      } else {
        connectBtn.style.display = "block";
        connectBtn.textContent = "I have installed the dependencies";
        connectBtn.onclick = () => {
          location.reload();
        };
      }
    }
  } catch (err) {
    statusEl.textContent = "Check error: " + err;
    statusEl.className = "status status-error";
  }
}

window.installDeps = async () => {
  const statusEl = document.getElementById("status");
  const installBtn = document.getElementById("installBtn");

  try {
    statusEl.textContent =
      "Installing dependencies... This may take several minutes.";
    statusEl.className = "status status-connecting";
    installBtn.disabled = true;
    installBtn.textContent = "Installing...";

    await InstallDependencies();

    // Reload status
    await checkDeps();
  } catch (err) {
    statusEl.innerHTML = `
      <div style="text-align: left; font-size: 14px;">
        <strong>Installation error</strong><br/>
        <br/>
        ${String(err).replace(/\n/g, "<br/>")}
      </div>
    `;
    statusEl.className = "status status-error";
    installBtn.disabled = false;
    installBtn.textContent = "Try again";
  }
};

window.connect = async () => {
  const statusEl = document.getElementById("status");
  const connectBtn = document.getElementById("connectBtn");
  const debugBtn = document.getElementById("debugBtn");
  const controls = document.getElementById("controls");

  try {
    statusEl.textContent = "Connecting...";
    statusEl.className = "status status-connecting";
    debugBtn.style.display = "none";

    await Connect();

    statusEl.textContent = "Connected";
    statusEl.className = "status status-connected";
    connectBtn.style.display = "none";
    controls.style.display = "block";

    // Load and set saved color
    await loadAndSetSavedColor();
  } catch (err) {
    const errorMsg = String(err);

    // Check if quadcastrgb installation is needed
    if (errorMsg.includes("quadcastrgb") && errorMsg.includes("not found")) {
      statusEl.innerHTML = `
        <div style="text-align: left; font-size: 14px;">
          <strong>quadcastrgb installation required</strong><br/>
          <br/>
          Run in terminal:<br/>
          <code style="background: rgba(0,0,0,0.1); padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">
            brew install quadcastrgb
          </code>
        </div>
      `;
      debugBtn.style.display = "none";
    } else if (errorMsg.includes("not found")) {
      statusEl.innerHTML = `
        <div style="text-align: left; font-size: 14px;">
          <strong>Device not found</strong><br/>
          <br/>
          • Connect HyperX QuadCast to your computer<br/>
          • Make sure the microphone is powered on<br/>
          • Try reconnecting the USB cable<br/>
          <br/>
          <small>If the microphone is connected, press the debug button below</small>
        </div>
      `;
      // Show debug button
      debugBtn.style.display = "block";
    } else {
      statusEl.textContent = "Error: " + err;
      debugBtn.style.display = "none";
    }

    statusEl.className = "status status-error";
    console.error(err);
  }
};

window.showDebugInfo = async () => {
  const statusEl = document.getElementById("status");

  try {
    statusEl.textContent = "Getting USB device information...";
    statusEl.className = "status status-connecting";

    const devices = await GetUSBDevices();

    // Create modal window with information
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 15px; max-width: 800px; max-height: 80vh; overflow: auto; color: #333;">
        <h2 style="margin-top: 0;">USB Devices (for debugging)</h2>
        <p>Copy this information and send it to the developer:</p>
        <textarea readonly style="width: 100%; height: 400px; font-family: monospace; font-size: 12px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">${devices}</textarea>
        <button onclick="this.parentElement.parentElement.remove(); checkDeps();" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (err) {
    statusEl.textContent = "Error getting information: " + err;
    statusEl.className = "status status-error";
  }
};

// Track the latest color to save
let pendingColorToSave = null;

window.setColorFromHex = async (hex) => {
  console.log("setColorFromHex called with:", hex);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const hexWithoutHash = hex.slice(1);

  // Always update pending color FIRST, before any async operations
  pendingColorToSave = hexWithoutHash;

  // Cancel any pending save
  if (saveColorTimeout) {
    clearTimeout(saveColorTimeout);
  }

  try {
    // Update UI first
    isUpdatingProgrammatically = true;
    document.getElementById("colorPicker").value = hex;
    isUpdatingProgrammatically = false;

    // Then send command to device
    await SetColor(r, g, b);

    // Schedule save - use pendingColorToSave to always get the latest color
    saveColorTimeout = setTimeout(async () => {
      const colorToSave = pendingColorToSave;
      console.log("Saving color:", colorToSave);
      try {
        await SaveColorSetting(colorToSave);
        console.log("Color saved successfully:", colorToSave);
      } catch (saveErr) {
        console.error("Error saving color:", saveErr);
      }
    }, 300);
  } catch (err) {
    console.error(err);
    alert("Error setting color: " + err);
  }
};

window.turnOff = async () => {
  try {
    await Off();
  } catch (err) {
    console.error(err);
    alert("Error: " + err);
  }
};

async function loadAndSetSavedColor() {
  try {
    const settings = await LoadSettings();
    console.log("Loaded settings:", settings);
    if (settings && settings.lastColor) {
      // Load saved color in hex format without #
      const hex = "#" + settings.lastColor;
      console.log("Applying saved color:", hex);
      isUpdatingProgrammatically = true;
      document.getElementById("colorPicker").value = hex;
      isUpdatingProgrammatically = false;

      // Apply color to device
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      await SetColor(r, g, b);
    }
  } catch (err) {
    console.error("Error loading saved color:", err);
  }
}
