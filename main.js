const electron = require('electron');
const path = require('path');
const {ipcMain} = require('electron');
const helperFuncs = require('./helperFuncs.js')

global.artistInfo = [];

function createMainWindow() {
  let mainWin = new electron.BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'helperFuncs.js')
    }
  });
  mainWin.loadFile('index.html');
  mainWin.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    electron.shell.openExternal(url); //urls will be opened in default browser
  });
}

//receive event messages from the window render process
ipcMain.on("firstbtnclick", async (event, arg) => {
  await helperFuncs.createAuthWindow();
  event.sender.send("firstbtnclick-task-finished", "yes");
});

ipcMain.on("secbtnclick", async (event, arg) => {
  await helperFuncs.lookUpConcerts();
  event.sender.send("secbtnclick-task-finished", artistInfo);
});

ipcMain.on("closebtnclick", async (event, arg) => {
  electron.app.quit();
  event.sender.send("closebtnclick-task-finished", "yes");
});

electron.app.on("ready", () => {
  createMainWindow();

  electron.app.on('window-all-closed', () => {
    //setting up proper closing behavior for all Operating Systems
    if(process.platform !== 'darwin'){
      electron.app.quit();
    }
  });

  electron.app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0){
      createMainWindow();
    }
  });
});
