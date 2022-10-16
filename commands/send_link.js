const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('share')
        .setDescription('Share a link to the playlist')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the playlist')
                .setRequired(true)),
        async execute(interaction) {
            await interaction.reply('https://open.spotify.com/playlist/6g27SKfQ1G4l2rwy0cGZXd?si=657bfd491ace4f13&pt=2ebc4a4552bbf175b643c0f108625c5c');
        }
    };
    