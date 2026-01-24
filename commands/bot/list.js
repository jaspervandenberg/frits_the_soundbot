const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const songs = require('../../bin/songs'); // Adjust the path as needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Lists all available sounds'),
  async execute(interaction) {
    try {
      // Get updated song list and format it
      const songString = songs.updateSongs().map((x) => x.replace('.mp3', '')).join(', ');

      // Create and configure the embed
      const messageEmbed = new EmbedBuilder()
        .setTitle('List of sounds')
        .setDescription(songString || 'No sounds found.');

      // Reply with the embed
      await interaction.reply({ embeds: [messageEmbed] });
    } catch (error) {
      console.error('Error listing sounds:', error);
      await interaction.reply({ content: 'There was an error listing sounds.', ephemeral: true });
    }
  },
};
