/* eslint-disable no-console */
const Discord = require('discord.js');
const config = require('./config/config');
const lib = require('./bin/lib');
const songs = require('./bin/songs');

const client = new Discord.Client();

client.on('message', (message) => {
  let isAdmin = false;
  let isUser = false;

  // Check if message is private
  // If message has attachments, upload them
  if (!message.guild) {
    if (message.attachments != null) {
      lib.uploadSound(message);
    } else if (message.author.id !== client.user.id) {
      message.channel.send('Mooi man');
    }
  } else {
    const userRoles = message.member.roles.cache.array();

    userRoles.forEach((role) => {
      if (role.name === config.roles.admin) {
        isAdmin = true;
      }
      if (role.name === config.roles.user) {
        isUser = true;
      }
    });

    if (message.content.toLowerCase() === '!help') {
      // Reply with list of commands based on role
      lib.helpMessage(message, isAdmin, isUser);
    } else if (message.content.toLowerCase() === '!list') {
      lib.listSounds(message);
    } else if (message.content.toLowerCase() === '!siebe') {
      // Reply with random chibba
      lib.chibba(message);
    } else if (message.content.toLowerCase() === '!siebetoday' || message.content.toLowerCase() === '!siebe_today') {
      // Reply with current chibba
      lib.chibbaToday(message);
    } else if (message.content.toLowerCase() === '!random') {
      // Play random sound if author is admin or user.
      if (isAdmin || isUser) {
        lib.playRandomSong(message);
      } else {
        lib.unAuthMessage(message);
      }
    } else if (songs.checkIfExists(`${message.content.replace('!', '').toLowerCase()}`) && message.content.startsWith('!')) {
      // Play specific sound if author is admin or user.
      if (isAdmin || isUser) {
        lib.playSpecificSong(message);
      } else {
        lib.unAuthMessage(message);
      }
    } else if (message.content.startsWith('!yt https://www.youtube.com/watch?v=')) {
      // Download and play youtube song if author is admin or user.
      if (isAdmin || isUser) {
        lib.downLoadFromYoutubeAndPlay(message);
      } else {
        lib.unAuthMessage(message);
      }
    } else if (message.content.startsWith('!delete ')) {
      // Delete song if author is admin.
      if (isAdmin) {
        lib.deleteSound(message);
      } else {
        lib.unAuthMessage(message);
      }
    } else if (message.content.toLowerCase().startsWith('!chibba')) {
      // React with chibbafied messages
      lib.reactChibbafied(message);
    } else if (message.author.id === client.user.id) {
      // If message is by the bot, don't do anything.
    } else {
      // React with random emoji on all other messages.
      lib.reactRandom(message);
    }
  }
});

client.on('ready', () => {
  console.error('Bot is ready!');
});

client.on('error', (error) => {
  console.error('Error: ', error);
});

client.login(config.bot.key);

//Every minute check if the current voicechannel is empty. If it is, disconnect
setInterval(() => {
  let connections = Array.from(client.voice.connections)
  if (connections.length > 0) {
    for (const connection of client.voice.connections.values()) {
      if (Array.from(connection.channel.members).length === 1) {
        connection.disconnect();
      }
    }
  }
}, 60000);

module.exports.client = client;
