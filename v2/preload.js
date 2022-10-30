// preload.js

// Modules to ipc flow
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', setupUI);

function setupButtons() {
  document.getElementById("closeBtn").addEventListener("click", function (e) {
    ipcRenderer.send('closeApp');
  });
}

function setupUI() {
  setupButtons();
}