const SpotifyWebApi = require("spotify-web-api-node");

var credentials = {
  clientId: 'someClientId',
  clientSecret: 'someClientSecret',
  redirectUri: 'http://www.michaelthelin.se/test-callback'
};

var spotifyApi = new SpotifyWebApi(credentials);

// The code that's returned as a query parameter to the redirect URI
var code = 'AQDKEcU1uzCoE9cCeLEsh5OIbNOA4XM6KcR5WbqWzYqrDNPHRHQtJP5D8o27VYsGNmhPBbb8sozsAtzjcsiJJbsMBeEOuqua6s6kLp76vqP-4VFgGx16bqMSlqpgUmbhIU79rtaeB63pVCVtdtrIkIDWMuDfgnTSELKlmVy9JYDG0HKfiR0QmFwqQqmO0LvstblaGN1mLhMnhne4MNmMxDWtg2DJfg';

// Retrieve an access token and a refresh token
spotifyApi.authorizationCodeGrant(code).then(
  function(data) {
    console.log('The token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);
    console.log('The refresh token is ' + data.body['refresh_token']);

    // Set the access token on the API object to use it in later calls
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
  },
  function(err) {
    console.log('Something went wrong!', err);
  }
);