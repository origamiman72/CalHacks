const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const {spotify_id, spotify_secret} = require('./config.json')
const client_id = spotify_id;                          // Your client id
const client_secret = spotify_secret;                  // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

const app = express();

let user_tokens = {}

const getLoginUrl = function(serverId, userId) {
  // your application requests authorization
  const scope = 'user-read-private ' +
                'playlist-read-private ' +
                'playlist-read-collaborative ' +
                'playlist-modify-private ' +
                'playlist-modify-public';

  var state = 'aldskjf';
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
  // your application requests refresh and access tokens
  // after checking the state parameter
  // (except it doesn't, because I deleted the state parameter :3)

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

module.exports = {getLoginUrl}
