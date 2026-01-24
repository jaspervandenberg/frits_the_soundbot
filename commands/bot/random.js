const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const _ = require('underscore');
const config = require('../../config/config'); // Adjust path as needed
const { playSound, getSongs } = require('../../bin/functions'); // Adjust path as needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Plays a random song in your voice channel'),
  async execute(interaction) {
    try {
      const member = interaction.member;
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({ content: 'You need to be in a voice channel to play a song!', flags: MessageFlags.Ephemeral });
      }

      const song = _.sample(getSongs());

      await playSound(config.bot.audioFolder + song + '.mp3', voiceChannel);

      await interaction.reply({ content: `Randomly chose ${song}` });

      setTimeout(() => {
        interaction.deleteReply().catch(() => { });
      }, 10_000);

    } catch (error) {
      console.error('Error in /random:', error);
      interaction.reply({ content: 'There was an error trying to play a random song.', flags: MessageFlags.Ephemeral });
    }
  },
};
