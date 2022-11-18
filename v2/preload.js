// preload.js

// Modules to ipc flow
const { PathGenerator } = require('./utils/pathGenerator');
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', setupUI);

function setupButtons() {
  document.getElementById("closeBtn").addEventListener("click", function (e) {
    ipcRenderer.send('closeApp');
  });
}

function setupUI() {
  setupButtons();
  setupPaths();
}

function setupPaths() {
  pathGenerator = new PathGenerator();
  var paths = document.getElementsByTagName("path");

  // set up paths
  Array.from(paths).forEach((p, i) => {
    p.setAttribute("d", pathGenerator.paths["SW"]);
    p.setAttribute("data-direction", "SW");
  });
}