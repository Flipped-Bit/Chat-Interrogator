// preload.js

// Modules to ipc flow
const { getAvailableVoices } = require('./services/configManager');
const { PathGenerator } = require('./utils/pathGenerator');
const { ipcRenderer } = require('electron');

var voiceIndexes = new Map();

window.addEventListener('DOMContentLoaded', setupUI);

function setupButtons() {
  document.getElementById("closeBtn").addEventListener("click", function (e) {
    ipcRenderer.send('closeApp');
  });
}

function setupControlPanels() {
  var sidebar = document.getElementById("sidebar");
  var controlPanels = sidebar.children;

  var voices = getAvailableVoices();

  // set up control panels
  Array.from(controlPanels).forEach((cp, i) => {
    cp.querySelector('input[type="checkbox"]').checked = true;
    cp.querySelector('select').disabled = false;

    setVoices(cp.querySelector('select'), "", voices);
  });
}

function setupUI() {
  setupButtons();
  setupControlPanels();
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

function setVoices(dropdown, voice, voices) {
  // Setup dropdown
  voices.forEach((v, i) => {
    if (voiceIndexes.has(v.label) == false) {
      voiceIndexes.set(v.label, i + 1);
    }
    var option = document.createElement('option');
    option.label = v.label;
    option.value = v.value;
    dropdown.append(option);
  });

  if (voiceIndexes.has(voice)) {
    dropdown.selectedIndex = voiceIndexes.get(voice);
  }
  else {
    dropdown.selectedIndex = 0;
    console.log(`Unable to set dropdown for voice:${voice}`);
  }
}