/* eslint-disable no-console */
const { Client, GatewayIntentBits, Partials, Collection, Events, MessageFlags } = require('discord.js');
const config = require('./config/config');
const lib = require('./bin/lib');
const songs = require('./bin/songs');
const path = require('node:path');
const fs = require('node:fs');

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,                // Needed for basic guild (server) functionality
    GatewayIntentBits.GuildMessages,         // Needed to send, edit, and delete messages
    GatewayIntentBits.MessageContent,        // Needed to read message content (important for commands or checking messages)
    GatewayIntentBits.GuildMessageReactions, // Needed to add or listen for reactions
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Message,    // Required to handle uncached messages (e.g., for reaction events)
    Partials.Channel,    // Needed if you're interacting with DM channels
    Partials.Reaction    // Required to fetch full reaction data
  ]
});

client.commands = new Collection();

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command || typeof command.autocomplete !== 'function') {
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(`Autocomplete error for command ${interaction.commandName}:`, error);
    }
  }
});

client.on('messageCreate', (message) => {
  let isAdmin = false;
  let isUser = false;

  // Check if message is private
  if (message.channel.type === 1) {
    if (message.attachments.size > 0) {
      lib.uploadSound(message);
    } else if (message.author.id !== client.user.id) {
      message.channel.send('Mooi man');
    }
  } else {
    const userRoles = [...message.member.roles.cache.values()];

    userRoles.forEach((role) => {
      if (role.name === config.roles.admin) {
        isAdmin = true;
      }
      if (role.name === config.roles.user) {
        isUser = true;
      }
    });

    if (message.content.toLowerCase() === '!list') {
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

client.login(config.bot.token);

module.exports.client = client;
