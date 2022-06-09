const dotenv = require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const electron = require('electron');
const axios = require('axios');

const ticketKey = process.env.TICKETMASTER_CONSUMER_KEY;

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'https://localhost:8000/callback'
});
let scope = ['user-top-read'],
  state = 'some-state';

const authorizeURL = spotifyApi.createAuthorizeURL(scope, state);
let topArtistsList = '';

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
      //grab the authentication code from the redirect URL that the spotify API will send
      if (newUrl.includes('code=')) {
        let firstIndex = newUrl.indexOf('code=')+5;
        let secondIndex = newUrl.indexOf("&state")-6;
        authCode = newUrl.substr(firstIndex, secondIndex);
        authCode = authCode.substr(0, authCode.indexOf("&state"));
        authWindow.hide();
        getAccessToken(authCode);
      }else {
        authWindow.close()
        sendError();
      }
    }
  });

  authWindow.on('closed', function() {
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
             topArtistsList += topArtists[i].name+'\t';
           }
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

async function lookUpConcerts (){
  let actualList = topArtistsList.split('\t');
  for (let i = 0; i < (actualList.length) - 1; i++) {
    //any artist names with spaces in them need to be replaced with %20 for the ticketmaster api
    let artistName = actualList[i].replace(/\s+/g, '%20');
    axios.get('https://app.ticketmaster.com/discovery/v2/events?apikey='
    + ticketKey + '&keyword='+artistName +'&locale=*&countryCode=US')
    .then(response => {
      if(response.data.hasOwnProperty('_embedded')){
        let random = Math.floor(Math.random() * (Object.keys(response.data._embedded.events).length));
        artistInfo.push({
          name: actualList[i],
          concertName:response.data._embedded.events[random].name,
          concertImage:response.data._embedded.events[random].images[0].url,
          concertDate:response.data._embedded.events[random].dates.start.localDate,
          concertURL: response.data._embedded.events[random].url,
          concertID: response.data._embedded.events[random].id
        })
      }
    })
    .catch(error => {
      console.log(error);
    });
    //must limit requests to the ticketmaster api to ~1 per second
    await sleep(1000);
  };
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

module.exports = {createAuthWindow, getAccessToken, lookUpConcerts};
