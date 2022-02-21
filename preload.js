// preload.js

let chatListener;
var maxLineLength = 26;
const { ipcRenderer } = require('electron');
const { ChatListener } = require('./services/chatListenerService');

window.addEventListener('DOMContentLoaded', () => {
  var channelName = document.getElementById("channelName").value;
  setupChatListener(channelName);

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
        setupChatListener(input.value.toLowerCase());
        updateUI("", "");
        break;
      default:
        break;
    }
  });

  document.getElementById("setUser").addEventListener("click", function (e) {
    var btn = document.getElementById("setUser");
    var input = document.getElementById("selectedUser");
    var username = document.getElementById("userName");

    switch (btn.value) {
      case "Set User":
        updateButton(btn, 'green', false, "Save");
        input.style.visibility = 'visible';
        break;
      case "Save":
        updateButton(btn, 'white', true, "Set User");
        input.style.visibility = 'hidden';
        username.innerText = input.value;
        break;
      default:
        break;
    }
  });

  ipcRenderer.on('newAvatarFound', (_, arg) => {
    var avatar = document.getElementById("avatar");
    avatar.href.baseVal = arg.src;
  })
})

function resetAnimations(){
  var lastMessage = document.getElementById("lastMessage");
  lastMessage.classList.remove("fadeOut");;
  // trigger a DOM reflow 
  void lastMessage.offsetWidth;
  document.querySelector("animate").beginElement();
  lastMessage.classList.add("fadeOut");
}

function setupChatListener(channelName) {
  if (chatListener !== undefined) {
    chatListener.disconnect();
  }

  chatListener = new ChatListener(channelName);

  chatListener.connect();

  chatListener.client.on('message', (channel, tags, message, self) => {
    var lastMessageSender = document.getElementById("userName").getAttribute("data-placeholder")
    var newMessageSender = tags['display-name'];
    var username = document.getElementById("userName").innerText;

    if (username == '') { 
      updateUI(`${newMessageSender}`, `${message}`);
      setAvatar(newMessageSender);
    }
    else if (newMessageSender == username) {
      updateUI(`${newMessageSender}`, `${message}`);
      if (lastMessageSender != newMessageSender) {
        setAvatar(newMessageSender); 
      }
    }
    else if (newMessageSender != username && document.getElementById("userName").getAttribute("data-placeholder") != username) {
      updateUI('', '');
    }
  });
}

function setAvatar(username) {
  var avatar = document.getElementById("avatar").href.baseVal;
  ipcRenderer.send('updateAvatar', { previous: avatar, user: username });
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

function updateLastLine(lines) {
  var editedLine = lines[4].slice(0,-3);
  lines[4] = editedLine.trim() + "...";
  return lines;
}

function updateUI(username, message) {
  setVisibility("speechBubble", message);
  resetAnimations();
  var validatedMessage = validate(message);
  document.getElementById("lastMessage").innerHTML = validatedMessage;
  document.getElementById("userName").setAttribute("data-placeholder", username);
}

function validate(message) {
  if (message == "") {
    return message;
  }
  var lines = message.match(new RegExp(".{1," + maxLineLength +"}(\\s|$)", 'g'));
  if (lines.length > 5) {
    trimmedLines = lines.slice(0, 5);
    updatedLines = updateLastLine(trimmedLines);
    return updatedLines.join("");
  }
  else {
    return message;
  }
}