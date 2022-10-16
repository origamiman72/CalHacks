const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a playlist')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('The name of the playlist')
                .setRequired(true)),
        async execute(interaction) {
            await interaction.reply('create_playlist');
        }
    };
    