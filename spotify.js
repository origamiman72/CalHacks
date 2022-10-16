const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const cors = require('cors');
const querystring = require('querystring');

const {spotify_id, spotify_secret} = require('./config.json')
const client_id = spotify_id;                          // Your client id
const client_secret = spotify_secret;                  // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

const SpotifyAPI = require('spotify-web-api-node');

const app = express();

// let user_tokens = {}
let user_tokens = {
  '1030995816212602981' : {
    '129310898807504897' : {
      access_token :
          'BQDrre8CvTlvzO9bQifgcLPhXtv89tvja7KAVC8kDtkbSQtTnX1EJr4pG1AR3G_eaHIzC2FKpq-MqprA4vNNz_F6xAloESlbSFGYUJLLNhdEXIEcu4FL82WdZhcHnSBIEBM19eDxbdvx_SV-a0QjSoJx1KdWiOAMbhUyhrvn_3Guh63Y_R_FWr02HFVx6kP6G-_ST-LuJeLNTKvIi6RMbLuwRRzD1abpS3BOG1eTSDfUjS4ABgPHLy4O8HigPareBuiXE8knTP3EN1-nhbMbyMwvmPU',
      refresh_token :
          'AQBW53E0KXfTwZjLWbi3NycjlHYGHG4RsRfCAQzUFNaMUq80x6K5zfh6DhLU_20a37uGJYL4bo2--5kmjRuc-2fPP1CdgK8vPVmq2bxJDw5JzqRVipOklx4U4e9YVr9KxYM'
    }
  }
}

const getSpotifyApi =
    (serverId, userId) => {
      return new SpotifyAPI(
          {accessToken : user_tokens[serverId][userId].access_token});
    }

const getUserId =
    (serverId, userId) => { return user_tokens[serverId][userId].id; }

const getLoginUrl = function(serverId, userId) {
  // your application requests authorization
  const scope = 'user-read-private ' +
                'playlist-read-private ' +
                'playlist-read-collaborative ' +
                'playlist-modify-private ' +
                'playlist-modify-public';

  const login_uri =
      'https://accounts.spotify.com/authorize?' + querystring.stringify({
        response_type : 'code',
        client_id : client_id,
        scope : scope,
        redirect_uri : redirect_uri,
        state : JSON.stringify({'serverId' : serverId, 'userId' : userId})
      });

  return login_uri
};

app.get('/callback', function(req, res) {
  let state = req.query.state || null;
  if (state === null) {
    res.redirect('https://www.youtube.com/watch?v=GHMjD0Lp5DY')
    return;
  }
  state = JSON.parse(state)
  const code = req.query.code || null;
  const authOptions = {
    url : 'https://accounts.spotify.com/api/token',
    form : {
      code : code,
      redirect_uri : redirect_uri,
      grant_type : 'authorization_code'
    },
    headers : {
      'Authorization' :
          'Basic ' +
              (Buffer.from(client_id + ':' + client_secret).toString('base64'))
    },
    json : true
  };
  const serverId = state["serverId"];
  const userId = state["userId"]

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {

      const access_token = body.access_token,
            refresh_token = body.refresh_token;

      const options = {
        url : 'https://api.spotify.com/v1/me',
        headers : {'Authorization' : 'Bearer ' + access_token},
        json : true
      };

      // use the access token to access the Spotify Web API
      request.get(options,
                  function(error, response, body) { console.log(body); });

      // we can also pass the token to the browser to make requests from there
      user_tokens[serverId] = {
        [userId] :
            {'access_token' : access_token, 'refresh_token' : refresh_token}
      };
      // Get the authenticated user
      const spotifyApi = getSpotifyApi(serverId, userId);
      spotifyApi.getMe().then(
          function(data) { user_tokens[serverId][userId].id = data.body.id },
          function(err) { console.log('Something went wrong!', err); });

      console.log(user_tokens)
      console.log("ACCESS TOKEN" + access_token)
      console.log("REFRESH TOKEN" + refresh_token)
      res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    } else {
      res.redirect('https://www.youtube.com/watch?v=GHMjD0Lp5DY')
    }
  });
  //}
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  const refresh_token = req.query.refresh_token;
  let state = req.query.state || null;
  if (state === null) {
    res.redirect('https://www.youtube.com/watch?v=GHMjD0Lp5DY')
    return;
  }
  state = JSON.parse(state)
  const authOptions = {
    url : 'https://accounts.spotify.com/api/token',
    headers : {
      'Authorization' :
          'Basic ' +
              (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form : {grant_type : 'refresh_token', refresh_token : refresh_token},
    json : true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({'access_token' : access_token});
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);

async function searchTracks(serverId, userId, song, interaction) {
  const spotifyApi = getSpotifyApi(serverId, userId);
  spotifyApi.searchTracks(song).then(
      function(data) {
        interaction.reply('Found ' +
                          data.body.tracks.items[0].external_urls.spotify)
      },
      function(err) { console.log(err); });
};

async function createPlaylist(serverId, userId, playlistName, description,
                              interaction) {
  const spotifyApi = getSpotifyApi(serverId, userId);
  spotifyApi
      .createPlaylist(playlistName, {
        'description' : description,
        'public' : false,
        'collaborative' : true
      })
      .then(function(data) { interaction.reply('Created playlist!'); },
            function(err) {
              console.log('Something went wrong!', err);
              interaction.reply("Something went wrong!")
            });
};

async function getPlaylist(serverId, userId, playlistName, owner, interaction) {
  const spotifyApi = getSpotifyApi(serverId, userId);

  console.log(owner)
  console.log(user_tokens)
  const playlistOwner = getUserId(owner);
  console.log(playlistOwner)

  spotifyApi.getUserPlaylists(playlistOwner)
      .then(function(data) { console.log('Retrieved playlists', data.body); },
            function(err) { console.log('Something went wrong!', err); });
  interaction.reply('check logs');

  // Get a playlist
  // spotifyApi.getPlaylist(playlistName)
  //     .then(
  //         function(data) {
  //           console.log('Some information about this playlist', data.body);
  //           interaction.reply('found playlist bois');
  //         },
  //         function(err) {
  //           console.log('Something went wrong!', err);
  //           interaction.reply("Something went wrong!")
  //         });
};

module.exports = {
  getLoginUrl,
  searchTracks,
  createPlaylist,
  getPlaylist,
}
