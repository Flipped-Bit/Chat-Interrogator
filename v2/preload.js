// preload.js

// Modules to ipc flow
const { getAvailableDirections, getAvailableVoices } = require('./services/configManager');
const { PathGenerator } = require('./utils/pathGenerator');
const { ipcRenderer } = require('electron');

var voiceIndexes = new Map();
var directions = [];

window.addEventListener('DOMContentLoaded', setupUI);

function setupButtons() {
  document.getElementById("closeBtn").addEventListener("click", function (e) {
    ipcRenderer.send('closeApp');
  });
}

function nextIcon(e, id) {
  var svgPath = document.getElementById(id).querySelector('path');
  var dir = svgPath.dataset.direction;

  // Get existing icon index
  var index = directions.indexOf(dir);

  // Get next icon
  var nextIndex = (index + 1) % directions.length;
  var newDir = directions[nextIndex];

  // Update to next icon
  svgPath.setAttribute("d", pathGenerator.paths[newDir]);
  svgPath.setAttribute("data-direction", newDir);
  e.target.previousElementSibling.value = newDir;
}

function previousIcon(e, id) {
  var svgPath = document.getElementById(id).querySelector('path');
  var dir = svgPath.dataset.direction;

  // Get existing icon index
  var index = directions.indexOf(dir);

  // Get prev icon
  var prevIndex = index > 0 ?
    index - 1 : directions.length - 1;
  var newDir = directions[prevIndex];

  // Update to prev icon
  svgPath.setAttribute("d", pathGenerator.paths[newDir]);
  svgPath.setAttribute("data-direction", newDir);
  e.target.nextElementSibling.value = newDir;
}

function setupControlPanels() {
  var sidebar = document.getElementById("sidebar");
  var controlPanels = sidebar.children;

  directions = getAvailableDirections();
  var voices = getAvailableVoices();

  // set up control panels
  Array.from(controlPanels).forEach((cp, i) => {
    cp.querySelector('input[type="checkbox"]').checked = true;
    cp.querySelector('input[type="checkbox"]').addEventListener("click", (e) => {
      var selector = e.target.previousElementSibling
      selector.disabled = !selector.disabled
    });
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