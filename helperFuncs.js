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
let concertsList = [];

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
           //topArtists.forEach(function(artist) {
            //  topArtistsList += artist.name;
           //});
           //console.log(topArtistsList);
          // console.log(topArtists[0].name);
           for(i in topArtists){
             //console.log(topArtists[i].name[i]);
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
  for (let i = 0; i < (actualList.length)-1; i++) {
    let artistName = actualList[i].replace(/\s+/g, '%20');
    let random = Math.floor(Math.random() * 7);
    axios.get('https://app.ticketmaster.com/discovery/v2/events?apikey='
    + ticketKey + '&keyword='+artistName +'&locale=*&countryCode=US')
    .then(response => {
      if(response.data.hasOwnProperty('_embedded')){
        let random = Math.floor(Math.random() * (Object.keys(response.data._embedded.events).length));
        console.log('Concert added for: '+artistName + ' number of events: ' + Object.keys(response.data._embedded.events).length);
        console.log('event #' + random);
        //console.log(response.data._embedded.events[random]);
        console.log(response.data._embedded.events[random].id);
        concertsList += response.data._embedded.events[random].id + '\t';
      }else{
        console.log('no event for: ' + artistName);
      }
    })
    .catch(error => {
      console.log(error);
    });
    await sleep(1000);
  };
  console.log(concertsList);
}

function testArtistList() {
  let actualList = topArtistsList.split('\t');
  console.log(actualList[0]);
  for(i in actualList){
    console.log(actualList[i]);
  }
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

module.exports = {createAuthWindow, getAccessToken, lookUpConcerts, testArtistList};
