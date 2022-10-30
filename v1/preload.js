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

  document.getElementById("minimiseBtn").addEventListener("click", function (e) {
    ipcRenderer.send('minimiseApp');
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

  document.getElementById("hideAvatar").addEventListener("click", function (e) {
    var avatar = document.getElementById("avatar");
    var btn = document.getElementById("hideAvatar");

    switch (btn.value) {
      case "Hide Avatar":
        updateButton(btn, 'white', true, "Show Avatar");
        avatar.style.visibility = 'hidden';
        break;
      case "Show Avatar":
        updateButton(btn, 'white', true, "Hide Avatar");
        avatar.style.visibility = 'visible';
        break;
      default:
        break;
    }
  });

  document.getElementById("nextAvatar").addEventListener("click", function (e) {
    var avatar = document.getElementById("avatar").href.baseVal;
    ipcRenderer.send('getNextAvatar', { current: avatar });
  })

  document.getElementById("prevAvatar").addEventListener("click", function (e) {
    var avatar = document.getElementById("avatar").href.baseVal;
    ipcRenderer.send('getPrevAvatar', { current: avatar });
  })

  document.getElementById("setUser").addEventListener("click", function (e) {
    var avatar = document.getElementById("avatar").href.baseVal;
    var btn = document.getElementById("setUser");
    var input = document.getElementById("selectedUser");
    var next = document.getElementById("nextAvatar");
    var prev = document.getElementById("prevAvatar");
    var username = document.getElementById("userName");

    switch (btn.value) {
      case "Set User":
        updateButton(btn, 'green', false, "Save");
        input.style.visibility = 'visible';
        next.style.visibility = 'visible';
        prev.style.visibility = 'visible';
        break;
      case "Save":
        ipcRenderer.send('setAvatar', { current: avatar, user:input.value.toLowerCase() });
        updateButton(btn, 'white', true, "Set User");
        input.style.visibility = 'hidden';
        next.style.visibility = 'hidden';
        prev.style.visibility = 'hidden';
        username.innerText = input.value;
        break;
      default:
        break;
    }
  });

  ipcRenderer.on('audioUpdated', (_, arg) => {
    updateAudio(arg.url);
  })

  ipcRenderer.on('newAvatarFound', (_, arg) => {
    var input = document.getElementById("selectedUser");
    if (input.style.visibility != 'visible' || arg.IsSettingAvatar) {
      var avatar = document.getElementById("avatar");
      avatar.href.baseVal = arg.src;
    }
  })
})

function resetAnimations() {
  var speechBubble = document.getElementById("speechBubble");
  var lastMessage = document.getElementById("lastMessage");
  lastMessage.classList.remove("fadeOut");
  speechBubble.classList.remove("fadeOut");
  // trigger a DOM reflow 
  void lastMessage.offsetWidth;
  void speechBubble.offsetWidth;
  lastMessage.classList.add("fadeOut");
  speechBubble.classList.add("fadeOut");
}

function setupChatListener(channelName) {
  if (chatListener !== undefined) {
    chatListener.disconnect();
  }

  chatListener = new ChatListener(channelName);

  chatListener.connect();

  chatListener.client.on('message', (channel, tags, message, self) => {
    var lastMessageSender = document.getElementById("userName").getAttribute("data-placeholder")
    var newMessageSender = { base: tags['username'] , display: tags['display-name']};
    var username = document.getElementById("userName").innerText;

    if (username == '') {
      updateUI(`${newMessageSender.display}`, `${message}`);
      setAvatar(newMessageSender.base);
    }
    else if (newMessageSender.base == username.toLowerCase()) {
      updateUI(`${newMessageSender.display}`, `${message}`);
      if (lastMessageSender != newMessageSender.display) {
        setAvatar(newMessageSender.base);
      }
      ipcRenderer.send('getTTS', { message: message });
    }
    else if (newMessageSender.base != username.toLowerCase() && document.getElementById("userName").getAttribute("data-placeholder") != username) {
      updateUI('', '');
    }
  });

  updateUI('', '');
}

function setAvatar(username) {
  var avatar = document.getElementById("avatar").href.baseVal;
  ipcRenderer.send('updateAvatar', { current: avatar, user: username });
}

function setVisibility(id, message) {
  var item = document.getElementById(id);
  switch (message) {
    case "":
      item.style.visibility = 'hidden';
      break;
    default:
      if (item.style.visibility !== 'visible') {
        item.style.visibility = 'visible';
      }
      break;
  }
}

function updateAudio(audioUrl) {
  var audioPlayer = document.getElementById('audioPlayer');
  var source = document.getElementById('audioSource');
  source.src = audioUrl;
  audioPlayer.load();
  audioPlayer.play();
}

function updateButton(button, colour, isHidden, value) {
  button.className = isHidden ? "button-hidden" : "button";
  button.style.backgroundColor = colour;
  button.value = value;
}

function updateLastLine(lines) {
  var editedLine = lines[4].slice(0, -3);
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