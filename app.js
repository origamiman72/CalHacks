const fs = require('node:fs');
const path = require('node:path');
const Discord = require('discord.js')
const Spotify = require('spotify-web-api-node');
const spotify_bot = require('./spotify.js')

// require('dotenv').config();
const {discordToken, discordClient, spotifyClient, spotifySecret} =
    require('./config.json');

var spotify = new Spotify({
  clientId : spotifyClient,
  clientSecret : spotifySecret,
});

var SlashCommandBuilder = Discord.SlashCommandBuilder;

const bot = new Discord.Client({intents : [ Discord.GatewayIntentBits.Guilds ]})
const rest = new Discord.REST({version : '10'}).setToken(discordToken);

spotify.clientCredentialsGrant().then(
    function(data) {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);

      // Save the access token so that it's used in future calls
      spotify.setAccessToken(data.body['access_token']);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    });

bot.once('ready', () => {console.log('Ready!')})

// bot.commands = new Collection();

bot.commands = new Discord.Collection();
const commands = [
    {
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
  spotify.searchTracks('Love').then(
      function(data) { console.log('Search by "Love"', data.body); },
      function(err) { console.error(err); });
        }
    },
    {
        data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Login to spotify')
        async execute(interaction) {
  login_url = spotify_bot.login_url() await interaction.reply(login_url)
        }
    } 

];
        // const commandsPath = path.join(__dirname, 'commands');
        // const commandFiles = fs.readdirSync(commandsPath).filter(file =>
        // file.endsWith('.js'));

        // for (const file of commandFiles) {
        // 	const filePath = path.join(commandsPath, file);
        // 	const command = require(filePath);
        //     console.log(command.data.name)
        // 	bot.commands.set(command.data.name, command);
        // 	commands.push(command.data.toJSON());
        // }
        console.log(commands)
        rest.put(Discord.Routes.applicationCommands(discordClient),
                 {body : commands})
            .then(data => console.log(`Successfully registered ${
                      data.length} application commands.`))
            .catch(console.error);

        // bot.on('interactionCreate', async interaction => {
        //     // if (!interaction.isChatInputCommand()) return;

        //     const command = bot.commands.get(interaction.commandName);
        //     console.log(interaction.commandName)

        //     if (!command) return;

        //     try {
        //         await command.execute(interaction);
        //     } catch (error) {
        //         console.error(error);
        //         await interaction.reply({ content: 'There was an error while
        //         executing this command!', ephemeral: true });
        //     }
        // });
        console.log(discordToken)
            // bot.login(discordToken);

            // rest.put(
            // 	Discord.Routes.applicationCommands(clientId),
            // 	{ body: commands },
            // );

            // const Discord = require('discord.js');
            // let LeagueAPI = require('node-valorant-api');
            // require('dotenv').config(); //Uncomment this line to run locally
            // with dotenv package var champions =
            // require('./DDragon/champion.json'); var queues =
            // require('./DDragon/queues.json'); var profiles =
            // require('./DDragon/profileicon.json'); LeagueAPI = new
            // LeagueAPI(process.env.RIOT_API_KEY, Region.NA); const bot = new
            // Discord.Client();

            // bot.once('ready', () => {
            //     bot.user.setActivity('Use !help for Commands');
            //     console.log('Ready!');
            // });
            // bot.on('message', message => {
            //     if (message.content.toLowerCase().startsWith("!record")) {
            //         let messageParams = message.content.split(" ");
            //         let msg = messageParams.length == 3 ?
            //         record(messageParams[1], messageParams[2]) :
            //         record(messageParams[1]); msg.then((m) =>
            //         message.channel.send(m));
            //     }
            //     if (message.content.toLowerCase().startsWith("!live")) {
            //         let msg = live(message.content.substring(6));
            //         msg.then((m) => message.channel.send(m));
            //     }
            //     if (message.content.toLowerCase().startsWith("!rank")) {
            //         let msg = rank(message.content.substring(6));
            //         msg.then((m) => message.channel.send(m));
            //     }
            //     if (message.content.toLowerCase().startsWith("!recent")) {
            //         let msg = recent(message.content.substring(8));
            //         msg.then((m) => message.channel.send(m));
            //     }
            //     if (message.content.toLowerCase().startsWith("!op")) {
            //         message.channel.send(`https://op.gg/summoner/userName=${message.content.substring(4)}`);
            //     }
            //     if (message.content.toLowerCase().startsWith("!help")) {
            //         let e = new Discord.MessageEmbed()
            //             .setTitle("Commands for LeagueBot")
            //             .addFields(
            //                 { name: "!record [Summoner] [page = 0]", value:
            //                 "Returns Game Data on The Summoner's most
            //                 recently finished matches." }, { name: "!live
            //                 [Summoner]", value: "Returns Game Data on live
            //                 match if summoner is currently in match" }, {
            //                 name: "!recent [Summoner]", value: "Returns
            //                 in-game Statistics from the Summoner's most
            //                 recently completed match" }, { name: "!OP
            //                 [Summoner]", value: "Returns a link to the
            //                 Summoner's OP.GG page for further statisitcs" },
            //                 { name: "!help", value: "Show this page!" }
            //             )
            //             .setFooter("Developed by Arunan Thiviyanathan",
            //             "https://arunanthivi.com");
            //         message.channel.send(e);
            //     }
            // }

            // bot.login(process.env.DISCORD_KEY);
