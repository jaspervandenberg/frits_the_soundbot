const { SlashCommandBuilder, MessageFlags, RoleFlags } = require('discord.js');
const config = require('../../config/config'); // Adjust path as needed
const { playSound, getSongs } = require('../../bin/functions'); // Adjust path as needed

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a sound')
    .addStringOption(option =>
      option.setName('sound')
        .setDescription('Sound name')
        .setAutocomplete(true)  // Enable autocomplete!
        .setRequired(true)
    ),

  async execute(interaction) {
    const sound = interaction.options.getString('sound');
    const file = config.bot.audioFolder + sound + '.mp3';
    interaction.reply({
      content: `Playing sound: ${sound}`,
      flags: MessageFlags.Ephemeral
    });
    playSound(file, interaction.member.voice.channel);
    setTimeout(() => {
      interaction.deleteReply().catch(() => { });
    }, 10_000);

  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const songNames = getSongs();
    const filtered = songNames.filter(name =>
      name.toLowerCase().includes(focusedValue.toLowerCase())
    ).slice(0, 25); // Discord only allows 25 suggestions

    await interaction.respond(
      filtered.map(name => ({ name, value: name }))
    );
  }
};
