// preload.js

let client;
const { ipcRenderer } = require('electron');
const tmi = require('tmi.js');

window.addEventListener('DOMContentLoaded', () => {
  setupClient("castlehead");

  document.getElementById("closeBtn").addEventListener("click", function (e) {
    ipcRenderer.send('closeApp');
  });
})

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

function updateUI(username, message) {
  document.getElementById("userName").placeholder = username;
  document.getElementById("lastMessage").innerHTML = message;
}