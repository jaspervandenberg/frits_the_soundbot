const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const config = require('../config/config');

// Plays the given file into the specified voiceChannel.
module.exports.playSound = async (filepath, voiceChannel) => {
  if (!voiceChannel) return;

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

    const player = createAudioPlayer();
    const resource = createAudioResource(filepath); // filepath must be a valid local path or stream

    connection.subscribe(player);
    player.play(resource);

    // Auto disconnect after the sound finishes
    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    player.on('error', err => {
      console.error('Audio player error:', err);
      connection.destroy();
    });
  } catch (err) {
    console.error('Voice connection failed:', err);
    connection.destroy();
  }
};

module.exports.getSongs = () => {
  try {
    return fs.readdirSync(config.bot.audioFolder)
      .filter(file => file.endsWith('.mp3'))
      .map(file => file.slice(0, -4));
  } catch (error) {
    console.error('Error reading audio folder:', error);
    return [];
  }
}
