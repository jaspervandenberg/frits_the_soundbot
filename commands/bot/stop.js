const { SlashCommandBuilder, MessageFlags, RoleFlags } = require('discord.js');
const config = require('../../config/config'); // Adjust path as needed
const { playSound, getSongs } = require('../../bin/functions'); // Adjust path as needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop it, get some help'),

  async execute(interaction) {
    const file = config.bot.audioFolder + 'stop.mp3';
    interaction.reply({
      content: `Stopping and getting some help.`,
      flags: MessageFlags.Ephemeral
    });
    playSound(file, interaction.member.voice.channel);
    setTimeout(() => {
      interaction.deleteReply().catch(() => { });
    }, 10_000);
  },
};
