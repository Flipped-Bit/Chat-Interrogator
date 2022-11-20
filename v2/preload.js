// preload.js

// Modules to ipc flow
const { getAvailableDirections, getAvailableVoices } = require('./services/configManager');
const { ChatListener } = require('./services/chatListenerService');
const { PathGenerator } = require('./utils/pathGenerator');
const { drag, endDrag, startDrag } = require('./services/canvasManager');
const { ipcRenderer } = require('electron');

let chatListener;
var voiceIndexes = new Map();
var isConnected = false;
var directions = [];
let isEditableItem = {};

window.addEventListener('DOMContentLoaded', setupUI);

function setupButtons() {
  document.getElementById("closeBtn").addEventListener("click", function (e) {
    ipcRenderer.send('closeApp');
  });

  document.getElementById("connect").addEventListener("click", function (e) {
    if (isConnected) {
      chatListener.disconnect();
    }
    else {
      setupChatlistener();
    }

    // disable layout editing
    var layoutEditButtons = document.querySelectorAll('button[class="edit"]')
    Array.from(layoutEditButtons).forEach(btn => {
      btn.disabled = !btn.disabled;
    });

    // set connection state and update UI
    isConnected = ! isConnected;
    e.target.innerText = isConnected ? "Disconnect" : "Connect";
  });
}

function editItem(e, id) {
  isEditableItem[id] = !isEditableItem[id]
  var group = document.getElementById(id);
  for (const child of group.children) {
      if (child.classList.contains("confine")) {
          child.classList.toggle("draggable");
      }
  }
  group.parentNode.appendChild(group);
  e.target.innerText = isEditableItem[id] ? "Save Layout" : "Edit Layout";

  // disable connect button if layout is being edited
  if (Object.values(isEditableItem).length > 0) {
    var isBeingEdited = Object.values(isEditableItem).some(e => e === true)
    document.getElementById("connect").disabled = isBeingEdited;
  }
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
  var controlPanels = document.querySelectorAll('#sidebar > div[class="card"]');

  directions = getAvailableDirections();
  var voices = getAvailableVoices();

  // set up control panels
  Array.from(controlPanels).forEach((cp, i) => {
    var id = i + 1;
    cp.querySelector('.prev').addEventListener("click", (e) => {
      previousIcon(e, id)
    });
    cp.querySelector('.direction-selector').value = "SW";
    cp.querySelector('.next').addEventListener("click", (e) => {
      nextIcon(e, id)
    });

    cp.querySelector('input[type="checkbox"]').checked = true;
    cp.querySelector('input[type="checkbox"]').addEventListener("click", (e) => {
      var selector = e.target.previousElementSibling
      selector.disabled = !selector.disabled
    });
    cp.querySelector('select').disabled = false;
    setVoices(cp.querySelector('select'), "", voices);

    cp.querySelector('.edit').addEventListener("click", (e) => {
      editItem(e, id)
    });
  });
}

function setupUI() {
  setupButtons();
  setupControlPanels();
  setUpCanvas();
  setupPaths();
}

function setupChatlistener() {
  var channel = document.querySelector('#channel-selector').value;

  if (channel === "") {
    return
  }

  chatListener = new ChatListener(channel);

  chatListener.connect();

  chatListener.client.on('message', (channel, tags, message, self) => {
    var sender = { base: tags['username'], display: tags['display-name'] };
    var username = sender.base !== sender.display.toLowerCase() ? sender.base : sender.display;
    console.log(`${username}: ${message}`);
  });
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

function setUpCanvas() {
  var canvas = document.getElementById("canvas");

  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', drag);
  canvas.addEventListener('mouseup', endDrag);
  canvas.addEventListener('mouseleave', endDrag);

  return canvas;
}