const dotenv = require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const electron = require('electron');

let ticketKey = process.env.TICKETMASTER_CONSUMER_KEY;

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://localhost'
});
let scope = ['user-top-read'],
  state = 'some-state';

const authorizeURL = spotifyApi.createAuthorizeURL(scope, state);
let topArtistsList = [];

function createMainWindow() {
  let mainWin = new electron.BrowserWindow({
    width: 800,
    height: 600
  });

  mainWin.loadFile('index.html');
}

function createAuthWindow() {
  let authCode = '';
  let authWindow = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      enableRemoteModule: false
    },
    show: false,
  })

  authWindow.loadURL(authorizeURL);
  const {session : {webRequest}} = authWindow.webContents;
  const filter = {
    urls: [
      'https://localhost/*'
    ]
  };
  authWindow.show();
  webRequest.onBeforeRequest(filter, function(details, callback) {
    const url = details.url;
    let firstIndex = url.indexOf('code=')+5;
    let secondIndex = url.indexOf("&state")-6;
    authCode = url.substr(firstIndex, secondIndex);
    authCode = authCode.substr(0, authCode.indexOf("&state"));

    callback({
      cancel: false
    });

    getAccessToken(authCode);
  });
  authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {
    console.log('Did it work?');
    console.log(newUrl);
  });

  //authWindow.close();
  authWindow.on('closed', function() {
    authWindow = null;
  });
}

async function getAccessToken(authCode){
  spotifyApi.authorizationCodeGrant(authCode).then(
    function(data) {
     //console.log('The token expires in ' + data.body['expires_in']);
     //console.log('The access token is ' + data.body['access_token']);
     //console.log('The refresh token is ' + data.body['refresh_token']);

     // Set the access token on the API object to use it in later calls
     spotifyApi.setAccessToken(data.body['access_token']);
     spotifyApi.setRefreshToken(data.body['refresh_token']);

     spotifyApi.getMyTopArtists().then(
       function(data){
         let topArtists = data.body.items;
         for(i in topArtists){
           //console.log(topArtists[i]);
           topArtistsList += topArtists[i].name +' ';
         }
         //console.log(topArtists);
         console.log("User top artists: ", topArtistsList);
       }, function (err){
         console.log("error getting user top artists: ", err);
       }
     );
   },
   function(err) {
     console.log('Something went wrong!', err);
   }
  );
  //return topArtistsList;
}
//electron.app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');
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
