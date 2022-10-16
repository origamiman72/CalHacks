const fs = require('node:fs');
const path = require('node:path');
const Discord = require('discord.js')
const spotify_bot = require('./spotify.js')

const {discordToken, discordClient, spotifyClient, spotifySecret} =
    require('./config.json');

var SlashCommandBuilder = Discord.SlashCommandBuilder;

const bot = new Discord.Client({intents : [ Discord.GatewayIntentBits.Guilds ]})
const rest = new Discord.REST({version : '10'}).setToken(discordToken);

bot.once('ready', () => {console.log('Ready!')})

bot.commands = new Discord.Collection();

const slashCommands = [
  {
    // Add tracks to playlist
    data :
        new SlashCommandBuilder()
            .setName('add')
            .setDescription('Add a song to the playlist')
            .addStringOption(
                option => option.setName('song')
                              .setDescription('The name and artist of the song')
                              .setRequired(true))
            .addStringOption(option =>
                                 option.setName('playlist')
                                     .setDescription('The name of the playlist')
                                     .setRequired(true))
            .addStringOption(option =>
                                 option.setName('owner')
                                     .setDescription('The name of the playlist')
                                     .setRequired(false)),
    async execute(interaction) {
      const user = interaction.user.id;
      const guild = interaction.guild.id;
      const songName = interaction.options.getString('song');
      const playlistName = interaction.options.getString('playlist');
      const owner = interaction.options.getString('owner');
      await spotify_bot.addToPlaylist(guild, user, songName, playlistName,
                                      owner === null ? user : owner,
                                      interaction);
    }
  },
  {
    // Log in user
    data : new SlashCommandBuilder().setName('login').setDescription(
        'Login to spotify'),
    async execute(interaction) {
      const user = interaction.user.id
      const guild = interaction.guild.id;
      const login_url = spotify_bot.getLoginUrl(guild, user);
      await interaction.reply(login_url);
    }
  },
  {
    // Search for track
    data :
        new SlashCommandBuilder()
            .setName('search')
            .setDescription('Search songs')
            .addStringOption(
                option => option.setName('song')
                              .setDescription('The name and artist of the song')
                              .setRequired(true)),
    async execute(interaction) {
      const user = interaction.user.id;
      const guild = interaction.guild.id;
      await spotify_bot.searchTracks(
          guild, user, interaction.options.getString('song'), interaction)
    }
  },
  {
    // Create playlist
    data :
        new SlashCommandBuilder()
            .setName('createplaylist')
            .setDescription('Create Playlist')
            .addStringOption(option => option.setName('name')
                                           .setDescription('The playlist name')
                                           .setRequired(true))
            .addStringOption(option => option.setName('description')
                                           .setDescription('description')
                                           .setRequired(false)),
    async execute(interaction) {
      const user = interaction.user.id;
      const guild = interaction.guild.id;
      await spotify_bot.createPlaylist(
          guild, user, interaction.options.getString('name'),
          interaction.options.getString('description'), interaction)
    }
  },
  {
    // Get playlist
    data :
        new SlashCommandBuilder()
            .setName('getplaylist2')
            .setDescription('Get Playlist')
            .addStringOption(option => option.setName('name')
                                           .setDescription('The playlist name')
                                           .setRequired(true))
            .addStringOption(option => option.setName('owner')
                                           .setDescription('The playlist name')
                                           .setRequired(false)),
    async execute(interaction) {
      const user = interaction.user.id
      const guild = interaction.guild.id
      const playlistName = interaction.options.getString('name')
      const owner = interaction.options.getString('owner');
      await spotify_bot.getPlaylist(guild, user, playlistName,
                                    owner === null ? user : owner, interaction)
    }
  },
  {
    // find user
    data : new SlashCommandBuilder().setName('me').setDescription('who r u'),
    async execute(interaction) {
      const user = interaction.user.id
      const guild = interaction.guild.id
      console.log(user);
      await interaction.reply(guild)
    }
  }

];

const commands = [];

for (const command of slashCommands) {
  bot.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

console.log(commands)
rest.put(Discord.Routes.applicationCommands(discordClient), {body : commands})
    .then(data => console.log(
              `Successfully registered ${data.length} application commands.`))
    .catch(console.error);

bot.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand())
    return;

  const command = bot.commands.get(interaction.commandName);
  console.log(interaction.commandName)

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content : 'There was an error while executing this command!',
      ephemeral : true
    });
  }
});
bot.login(discordToken);
