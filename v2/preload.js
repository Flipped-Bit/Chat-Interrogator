// preload.js

var maxLineLength = 26;
const { getAvailableDirections, getAvailableVoices } = require('./services/configManager');
const { ChatListener } = require('./services/chatListenerService');
const { PathGenerator } = require('./utils/pathGenerator');
const { drag, endDrag, startDrag } = require('./services/canvasManager');
const { load, save } = require('./services/stateManager');
// Modules to ipc flow
const { ipcRenderer } = require('electron');

let state;
let chatListener, pathGenerator;
var voiceIndexes = new Map();
var isConnected = false;
var directions = [];
let isEditableItem = {};

window.addEventListener('DOMContentLoaded', setupUI);

function setupButtons() {
  document.getElementById("closeBtn").addEventListener("click", function (e) {
    state = getLatestState();
    save(state);
    ipcRenderer.send('closeApp');
  });

  document.getElementById("connect").addEventListener("click", function (e) {
    if (isConnected) {
      chatListener.disconnect();
    }
    else {
      setupChatlistener();
    }

    if (chatListener !== undefined) {
      // disable layout editing
      var layoutEditButtons = document.querySelectorAll('button[class="edit"]')
      Array.from(layoutEditButtons).forEach(btn => {
        btn.disabled = !btn.disabled;
      });

      // set connection state and update UI
      isConnected = !isConnected;
      e.target.innerText = isConnected ? "Disconnect" : "Connect";
      document.querySelector('#channel-selector').disabled = isConnected;
    }
  });
}

function editItem(e, id) {
  isEditableItem[id] = !isEditableItem[id]
  var group = document.getElementById(id);
  for (const child of group.children) {
    if (child.classList.contains("confine")) {
      child.classList.toggle("draggable");
    }
    if (child.classList.contains("fadeOut")) {
      child.classList.remove("fadeOut");
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

function setupControlPanels(state) {
  var controlPanels = document.querySelectorAll('#sidebar > div[class="card"]');

  directions = getAvailableDirections();
  var voices = getAvailableVoices();

  // set up control panels
  Array.from(controlPanels).forEach((cp, i) => {
    cp.querySelector('.card-header').value = state[i].assignedName;

    var id = i + 1;
    cp.querySelector('.prev').addEventListener("click", (e) => {
      previousIcon(e, id);
    });
    cp.querySelector('.direction-selector').value = state[i].type;
    cp.querySelector('.next').addEventListener("click", (e) => {
      nextIcon(e, id);
    });

    cp.querySelector('.username-selector').value = state[i].assignedUser;
    cp.querySelector('.username-selector').addEventListener("input", (e) => {
      var l = document.getElementById(`UN${id}`);
      l.textContent = e.target.value !== "" ? e.target.value : "USERNAME";
    });

    cp.querySelector('input[type="checkbox"]').checked = state[i].voice.enabled;
    cp.querySelector('input[type="checkbox"]').addEventListener("click", (e) => {
      var selector = e.target.previousElementSibling;
      selector.disabled = !selector.disabled;
    });
    cp.querySelector('select').disabled = !state[i].voice.enabled;
    setVoices(cp.querySelector('select'), state[i].voice.selected, voices);

    cp.querySelector('.edit').addEventListener("click", (e) => {
      editItem(e, id);
    });
  });
}

function setupUI() {
  state = load();
  setupCanvas(state);
  setupButtons();
  setupControlPanels(state);
}

function setupChatlistener() {
  if (chatListener !== undefined) {
    chatListener.disconnect();
  }

  var channel = document.querySelector('#channel-selector').value;

  if (channel === "") {
    if (chatListener !== undefined) {
      chatListener.disconnect();
      chatListener = undefined;
    }
    return;
  }

  chatListener = new ChatListener(channel);

  chatListener.connect();

  chatListener.client.on('message', (channel, tags, message, self) => {
    var sender = { base: tags['username'], display: tags['display-name'] };
    var username = sender.base !== sender.display.toLowerCase() ? sender.base : sender.display;
    console.info(`${username}: ${message}`);

    var labels = document.getElementsByTagName("text");
    var foundUser = Array.from(labels)
      .find(e => e.textContent.toLowerCase() == username.toLowerCase());

    if (foundUser !== undefined) {
      // get voice
      var voice = document.getElementById(`VC${foundUser.dataset.id}`)
      if (!voice.disabled) {
        if (voice.selectedIndex !== 0) {
          var voiceName = voice.selectedOptions[0];
          ipcRenderer.send('getTTS', { id: foundUser.dataset.id, message: message, voice: voiceName.value });
        }
      }
      updateUI(foundUser.dataset.id, message, username);
    }
  });
}

function updateUI(id, message, username) {
  var label = document.getElementById(`UN${id}`);
  label.textContent = username;

  var lastMessage = document.getElementById(`LM${id}`);
  lastMessage.innerText = validate(message);

  var speechBubble = document.getElementById(`SB${id}`);
  resetAnimations(id, lastMessage, speechBubble);
}

function validate(message) {
  if (message == "") {
    return message;
  }
  var lines = message.match(new RegExp(".{1," + maxLineLength + "}(\\s|$)", 'g'));
  if (lines.length > 5) {
    trimmedLines = lines.slice(0, 5);
    updatedLines = updateLastLine(trimmedLines);
    return updatedLines.join("");
  }
  else {
    return message;
  }
}

function updateLastLine(lines) {
  var editedLine = lines[4].slice(0, -3);
  lines[4] = editedLine.trim() + "...";
  return lines;
}

function setVoices(dropdown, voice, voices) {
  // Add default case (None) to voice indexes
  voiceIndexes.set('None', 0);

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
    console.warn(`Unable to set dropdown for voice:${voice}, defaulting to None`);
    dropdown.selectedIndex = 0;
  }
}

// State management
function getLatestState() {
  var newState = [];
  var groups = Array.from(document.getElementsByTagName("g"))
    .sort((a, b) => a.id - b.id);
  groups.forEach((g) => {
    var item = {};
    item = getConfigData(g.id, item);
    newState.push(item);
  });

  return newState;
}

function getCanvasPositions(id, item) {
  var l = document.getElementById(`UN${id}`);
  item.labelOffset = getTranslationCoordinates(l);

  var p = document.getElementById(`SB${id}`);
  item.offset = getTranslationCoordinates(p);

  return item;
}

function getConfigData(id, item) {
  var c = document.getElementById(`config-${id}`);
  item.assignedName = c.querySelector('.card-header').value;
  item.assignedUser = c.querySelector('.username-selector').value;

  item = getCanvasPositions(id, item);

  item.type = c.querySelector('.direction-selector').value;

  var enabled = c.querySelector('input[type="checkbox"]').checked;
  var selectedVoice = c.querySelector('select').selectedOptions[0];
  var selected = selectedVoice.label == "Select a Voice" ? "None" : selectedVoice.label;

  item.voice = { enabled, selected };

  return item;
}

function getTranslationCoordinates(element) {
  var transform = element.getAttribute('transform');
  var coords = transform.match(/\d+\.?\d?/g);

  return { x: Number(coords[0]), y: Number(coords[1]) };
}

// Canvas Setup
function setupCanvas(state) {

  setupCanvasItems(state);
  setupCanvasEvents();
}

function setupCanvasEvents() {
  var canvas = document.getElementById("canvas");

  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', drag);
  canvas.addEventListener('mouseup', endDrag);
  canvas.addEventListener('mouseleave', endDrag);
}

function setupCanvasItems(state) {
  pathGenerator = new PathGenerator();
  var groups = document.getElementsByTagName("g");

  Array.from(groups).forEach((g, i) => {
    var id = i + 1;
    var p = document.getElementById(`SB${id}`);
    p.setAttribute("d", pathGenerator.paths[state[i].type]);
    p.setAttribute("data-direction", state[i].type);
    p.setAttribute('transform', `translate(${state[i].offset.x},${state[i].offset.y})`);

    var l = document.getElementById(`UN${id}`);
    l.textContent = state[i].assignedUser !== "" ? state[i].assignedUser : "USERNAME";
    l.setAttribute('transform', `translate(${state[i].labelOffset.x},${state[i].labelOffset.y})`);

    var c = document.getElementById(`MC${id}`);
    c.setAttribute('transform', `translate(${state[i].offset.x},${state[i].offset.y})`);
  });
}

function resetAnimations(id, lm, sb) {
  // bring to top
  var group = document.getElementById(id);
  group.parentNode.appendChild(group);

  // remove used animation
  lm.classList.remove("fadeOut");
  sb.classList.remove("fadeOut");

  // trigger a DOM reflow 
  void lm.offsetWidth;
  void sb.offsetWidth;

  // re-add animation
  lm.classList.add("fadeOut");
  sb.classList.add("fadeOut");
}