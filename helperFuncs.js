const dotenv = require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const electron = require('electron');

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

async function createAuthWindow() {
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
  authWindow.show();
  authWindow.webContents.on('did-redirect-navigation', function(event, newUrl) {
    event.preventDefault();
    if (newUrl.includes('https://localhost:8000/callback')) {
      if (newUrl.includes('code=')) {
        let firstIndex = newUrl.indexOf('code=')+5;
        let secondIndex = newUrl.indexOf("&state")-6;
        authCode = newUrl.substr(firstIndex, secondIndex);
        authCode = authCode.substr(0, authCode.indexOf("&state"));
        authWindow.hide();
        //Promise.resolve(authCode).then(getAccessToken(authCode))
        getAccessToken(authCode);
      //  authWindow.close();
        //authWindow.location.href = 'index.html'
        //setTimeout(function() { authWindow.close;}, 3000);
      }else {
        authWindow.close()
        sendError();
      }
    }
  });

  authWindow.on('hidden', function() {
    authWindow = null;
  });
}

async function getAccessToken(authCode){
    spotifyApi.authorizationCodeGrant(authCode).then(
      function(data) {
       // Set the access token on the API object to use it in later calls
       spotifyApi.setAccessToken(data.body['access_token']);
       spotifyApi.setRefreshToken(data.body['refresh_token']);

       spotifyApi.getMyTopArtists().then(
         function(data){
           let topArtists = data.body.items;
           for(i in topArtists){
             //console.log(topArtists[i].name);
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
}

function printArtistList (){
  console.log(topArtistsList);
}
module.exports = {createAuthWindow, getAccessToken, printArtistList};
