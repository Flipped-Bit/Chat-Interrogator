// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const defaultAvatar = '.\\resources\\avatars\\defaultUser.png';
const fs = require('fs');
const path = require('path');
const userAvatarMap = new Map();
let avatarFolder;
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
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
  getAvatarFolder();

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

ipcMain.on('minimiseApp', (evt, arg) => {
  mainWindow.minimize();
});

ipcMain.on('updateAvatar', (evt, arg) => {
  var username = arg.user;
  var lastAvatar = arg.previous.replace(avatarFolder, "");;
  var newAvatar = getUserAvatar(username, lastAvatar);

  mainWindow.webContents.send('newAvatarFound', { src: newAvatar });
});

function getAvatarFolder() {
  avatarFolder = `${process.env.APPDATA}\\Chat Interrogator\\avatars`;
}

function getAvailableAvatars(lastAvatar) {
  var avatars = fs.readdirSync(avatarFolder)
    .filter(a => a.endsWith('.png'));

  if (lastAvatar != null) {
    avatars = avatars.filter(a => a !== lastAvatar)
  }

  return avatars;
}

function getRandomAvatar(avatars) {
  return avatars[Math.floor(Math.random() * avatars.length)];
}

function getUserAvatar(username, lastAvatar) {
  let avatar;

  if (userAvatarMap.has(username)) {
    avatar = userAvatarMap.get(username);
    avatar = fs.existsSync(avatar) == false ?
      `${avatarFolder}\\${avatar}` : defaultAvatar;
  }
  else {
    if (fs.existsSync(avatarFolder)) {
      var availableAvatars = getAvailableAvatars(lastAvatar);
      if (availableAvatars.length > 0) {
        avatar = getRandomAvatar(availableAvatars);
        userAvatarMap.set(username, avatar);
        avatar = `${avatarFolder}\\${avatar}`
      }
      else {
        avatar = defaultAvatar;
      }
    }
    else {
      avatar = defaultAvatar;
    }
  }

  return avatar;
}