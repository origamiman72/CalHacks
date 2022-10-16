const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const cors = require('cors');
const querystring = require('querystring');

const {spotify_id, spotify_secret} = require('./config.json')
let {user_tokens} = require('./user_tokens.json')
const client_id = spotify_id;                          // Your client id
const client_secret = spotify_secret;                  // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

const SpotifyAPI = require('spotify-web-api-node');

const app = express();

// let user_tokens = {}
// let user_tokens = {
//  '1030995816212602981' : {
//    '129310898807504897' : {
//      access_token :
//          'BQDrre8CvTlvzO9bQifgcLPhXtv89tvja7KAVC8kDtkbSQtTnX1EJr4pG1AR3G_eaHIzC2FKpq-MqprA4vNNz_F6xAloESlbSFGYUJLLNhdEXIEcu4FL82WdZhcHnSBIEBM19eDxbdvx_SV-a0QjSoJx1KdWiOAMbhUyhrvn_3Guh63Y_R_FWr02HFVx6kP6G-_ST-LuJeLNTKvIi6RMbLuwRRzD1abpS3BOG1eTSDfUjS4ABgPHLy4O8HigPareBuiXE8knTP3EN1-nhbMbyMwvmPU',
//      refresh_token :
//          'AQBW53E0KXfTwZjLWbi3NycjlHYGHG4RsRfCAQzUFNaMUq80x6K5zfh6DhLU_20a37uGJYL4bo2--5kmjRuc-2fPP1CdgK8vPVmq2bxJDw5JzqRVipOklx4U4e9YVr9KxYM'
//    }
//  }
//}
console.log(user_tokens);

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
      if (user_tokens.hasOwnProperty(serverId)) {
        user_tokens[serverId][userId] = {
          'access_token' : access_token,
          'refresh_token' : refresh_token
        };

      } else {
        user_tokens[serverId] = {
          [userId] :
              {'access_token' : access_token, 'refresh_token' : refresh_token}
        };
      }
      // Get the authenticated user
      const spotifyApi = getSpotifyApi(serverId, userId);
      spotifyApi.getMe().then(
          function(data) { user_tokens[serverId][userId].id = data.body.id },
          function(err) { console.log('Could not get username', err); });

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

async function searchTracksHelper(spotifyApi, song) {
  return spotifyApi.searchTracks(song).then(
      function(data) { return data.body.tracks.items[0]; },
      function(err) {
        console.log(err);
        throw err;
      });
}

async function searchTracks(serverId, userId, song, interaction) {
  const spotifyApi = getSpotifyApi(serverId, userId);
  searchTracksHelper(spotifyApi, song)
      .then(
          (song) => {
            interaction.reply('Found ' + song.external_urls.spotify);
          },
          (err) => {
            console.log(err);
            interaction.reply("Could not find song.");
          });
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

async function getPlaylistHelper(spotifyApi, playlistOwner, playlistName) {
  return spotifyApi.getUserPlaylists(playlistOwner)
      .then(
          async function(data) {
            const allPlaylists = data.body.items;
            const matchingNames =
                allPlaylists.filter((item) => item.name === playlistName);
            console.log(matchingNames);
            if (matchingNames === null || matchingNames.length === 0) {
              return null;
            }
            const selectedPlaylist = matchingNames[0];

            // Get a playlist
            return spotifyApi.getPlaylist(selectedPlaylist.id)
                .then(function(data) { return data.body; },
                      function(err) {
                        console.log(err);
                        return null;
                      });
          },
          function(err) {
            console.log(err);
            return null;
          });
}

async function getPlaylist(serverId, userId, playlistName, owner, interaction) {
  const spotifyApi = getSpotifyApi(serverId, userId);

  const playlistOwner = getUserId(serverId, owner);

  getPlaylistHelper(spotifyApi, playlistOwner, playlistName).then((data) => {
    if (data === null) {
      interaction.reply("Could not find playlist");
    } else {
      interaction.reply(data.external_urls.spotify)
    }
  }, (err) => console.log(err));
};

async function addToPlaylist(serverId, userId, songName, playlistName, owner,
                             interaction) {
  const spotifyApi = getSpotifyApi(serverId, userId);

  const playlistOwner = getUserId(serverId, owner);
  getPlaylistHelper(spotifyApi, playlistOwner, playlistName)
      .then(
          (playlist) => {
            if (playlist === null) {
              interaction.reply("Could not find playlist");
              return;
            }
            searchTracksHelper(spotifyApi, songName)
                .then(
                    (song) => {
                      console.log(song);
                      spotifyApi.addTracksToPlaylist(playlist.id, [ song.uri ])
                          .then(
                              (data) => {
                                interaction.reply(
                                    "Added song to playlist! " +
                                    playlist.external_urls.spotify);
                              },
                              (err) => {
                                console.log(err);
                                interaction.reply("Could not add song");
                              });
                    },
                    (err) => {
                      console.log(err);
                      interaction.reply("Could not find song");
                    });
          },
          (err) => {
            console.log(err);
            interaction.reply("Could not find playlist");
          });
};

module.exports = {
  getLoginUrl,
  searchTracks,
  createPlaylist,
  getPlaylist,
  addToPlaylist,
}
