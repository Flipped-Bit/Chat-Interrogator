// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const { AvatarManager } = require('./services/avatarManagerService');
const https = require('https');
const path = require('path');
let avatarManager;
let mainWindow;

function createAvatarManager() {
  avatarManager = new AvatarManager();
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 960,
    height: 540,
    transparent: true,
    frame: false,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nativeWindowOpen: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: false
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  createAvatarManager();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('closeApp', (evt, arg) => {
  app.quit();
});

ipcMain.on('getNextAvatar', (evt, arg) => {
  avatarManager.setCurrent(arg.current);
  var newAvatar = avatarManager.next();
  mainWindow.webContents.send('newAvatarFound', { src: newAvatar, IsSettingAvatar: true });
});

ipcMain.on('getPrevAvatar', (evt, arg) => {
  avatarManager.setCurrent(arg.current);
  var newAvatar = avatarManager.prev();
  mainWindow.webContents.send('newAvatarFound', { src: newAvatar, IsSettingAvatar: true });
});

ipcMain.on('getTTS', async (evt, arg) => {
  var result = await getAudioForText(arg.message);
  var parsedResult = JSON.parse(result);
  mainWindow.webContents.send('audioUpdated', { url: parsedResult.speak_url })
});

ipcMain.on('minimiseApp', (evt, arg) => {
  mainWindow.minimize();
});

ipcMain.on('setAvatar', (evt, arg) => {
  avatarManager.setForUser(arg.user, arg.current);
});

ipcMain.on('updateAvatar', (evt, arg) => {
  avatarManager.setCurrent(arg.current);
  var newAvatar = avatarManager.getForUser(arg.user);
  mainWindow.webContents.send('newAvatarFound', { src: newAvatar, IsSettingAvatar: false });
});

function getAudioForText(text, voice = 'Brian') {
  const data = JSON.stringify({
    voice: voice,
    text: text
  });

  const options = {
    hostname: 'streamlabs.com',
    path: '/polly/speak',
    port: 443,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise(function (resolve, reject) {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });

    }).on("error", (err) => {
      reject(err.message);
    });

    req.write(data);
    req.end();
  });
}