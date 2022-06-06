const electron = require('electron');
const path = require('path');
const {ipcMain} = require('electron');
const helperFuncs = require('./helperFuncs.js')

function createMainWindow() {
  let mainWin = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWin.loadFile('index.html');
  mainWin.webContents.openDevTools();
}

ipcMain.on("firstbtnclick", async (event, arg) => {
  await helperFuncs.createAuthWindow();
  console.log('testing');
  event.sender.send("firstbtnclick-task-finished", "yes");
});

ipcMain.on("secbtnclick", async (event, arg) => {
  helperFuncs.printArtistList();
  console.log('testing');
  event.sender.send("secbtnclick-task-finished", "yes");
});

ipcMain.on("closebtnclick", async (event, arg) => {
  electron.app.quit();
  event.sender.send("closebtnclick-task-finished", "yes");
});

electron.app.on("ready", () => {
  createMainWindow();

  electron.app.on('window-all-closed', () => {
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
