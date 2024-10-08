// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1080,
    frame: false,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nativeWindowOpen: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})

ipcMain.on('closeApp', (evt, arg) => {
  app.quit();
});

ipcMain.on('getTTS', async (evt, arg) => {
  var result = await getAudioForText(arg.message, arg.voice);
  var parsedResult = JSON.parse(result);
  mainWindow.webContents.send('audioUpdated', { id: arg.id, url: parsedResult.speak_url })
});

function getAudioForText(text, voice) {
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
      'Content-Length': data.length,
      'referer': 'https://streamlabs.com'
    }
  };

  return new Promise(function (resolve, reject) {
    const req = https.request(options, (res) => {
      let result = '';

      res.on('data', (chunk) => {
        result += chunk;
      });

      res.on('end', () => {
        resolve(result);
      });

    }).on("error", (err) => {
      reject(err.message);
    });

    req.write(data);
    req.end();
  });
}