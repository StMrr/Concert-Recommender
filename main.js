const dotenv = require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const electron = require('electron');
const path = require('path');
const {ipcMain} = require('electron');
const helperFuncs = require('./helperFuncs.js')

let ticketKey = process.env.TICKETMASTER_CONSUMER_KEY;

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://localhost:8000/callback'
});
let scope = ['user-top-read'],
  state = 'some-state';

const authorizeURL = spotifyApi.createAuthorizeURL(scope, state);
let topArtistsList = [];

function createMainWindow() {
  let mainWin = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
      //preload: path.join(__dirname, 'helperFuncs.js')
    }
  });

  mainWin.loadFile('index.html');
  //mainWin.webContents.openDevTools();
}

ipcMain.on("btnclick", async (event, arg) => {
  await helperFuncs.createAuthWindow();
  console.log('testing');
  event.sender.send("btnclick-task-finished", "yes");
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
/*
  electron.app.on('window-all-closed', () => {
    app.quit();
  });
*/
});
