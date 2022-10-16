const { SlashCommandBuilder } = require('discord.js')
var SpotifyWebApi = require('spotify-web-api-node');

var spotify = new SpotifyWebApi();
module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a song to the playlist')
        .addStringOption(option => 
            option.setName('song')
                .setDescription('The name and artist of the song')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('The name of the playlist')
                .setRequired(true)),
        async execute(interaction) {
            spotify.searchTracks('Love')
                .then(function(data) {
                    console.log('Search by "Love"', data.body);
                }, function(err) {
                    console.error(err);
                });
        }
    };
    