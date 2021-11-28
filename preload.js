// preload.js

let client;
const { ipcRenderer } = require('electron');
const tmi = require('tmi.js');

window.addEventListener('DOMContentLoaded', () => {
  var channelName = document.getElementById("channelName").value;
  setupClient(channelName);

  document.getElementById("closeBtn").addEventListener("click", function (e) {
    ipcRenderer.send('closeApp');
  });

  document.getElementById("editChannel").addEventListener("click", function (e) {
    var btn = document.getElementById("editChannel");
    var input = document.getElementById("channelName");

    switch (btn.value) {
      case "Edit":
        updateButton(btn, 'green', false, "Save");
        input.style.visibility = 'visible';
        break;
      case "Save":
        updateButton(btn, 'white', true, "Edit");
        input.style.visibility = 'hidden';
        setupClient(input.value.toLowerCase());
        updateUI("", "");
        break;
      default:
        break;
    }

  });
})

function resetAnimations(){
  document.querySelector("animate").beginElement();
}

function setupClient(channelName) {
  if (client !== undefined) {
    client.disconnect();
  }

  client = new tmi.Client({
    options: { debug: true, messagesLogLevel: "info" },
    channels: [`${channelName}`],
    connection: {
      reconnect: true,
      secure: true
    }
  });

  client.connect();

  client.on('message', (channel, tags, message, self) => {
    var username = document.getElementById("userName").value;

    if (tags['display-name'] == username || username == '') {
      updateUI(`${tags['display-name']}`, `${message}`);
    }
    else if (tags['display-name'] != username && document.getElementById("userName").placeholder != username) {
      updateUI('', '');
    }
  });
}

function setVisibility(id, message){
  var speechBubble = document.getElementById(id);
  switch (message) {
    case "":
      speechBubble.style.visibility = 'hidden';
      break;
    default:
      if (speechBubble.style.visibility !== 'visible') {
        speechBubble.style.visibility = 'visible';
      }
      break;
  }
}

function updateButton(button, colour, isHidden, value){
  button.className = isHidden ? "button-hidden" : "button";
  button.style.backgroundColor = colour;
  button.value = value;
}

function updateUI(username, message) {
  setVisibility("speechBubble", message);
  resetAnimations();
  document.getElementById("lastMessage").innerHTML = message;
  document.getElementById("userName").placeholder = username;
}