const config = require("./config/config");
const lib = require('./bin/lib');
const Discord = require('discord.js');
const fs = require('fs');
const _ = require('underscore');
const client = new Discord.Client();

client.on('message', message => {
    //Check if author is an admin or user.
    let isAdmin = lib.checkIfAdmin(message.author.id);
    let isUser = lib.checkIfUser(message.author.id);

    //Load list of songs.
    var songs = fs.readdirSync(config.bot.audioFolder);

    if (message.member == null && message.attachments != null) {
        // Message has no member, so its a private message.
        let attachment = message.attachments.values().next().value
        if (attachment != null) {
            lib.downloadAndWriteToFile(config.bot.audioFolder + attachment.filename.toLowerCase(), attachment.url, message.channel)
        } else {
            message.channel.send('Mooi man');
        }
    } else if (message.content.toLowerCase() == 'list') {
        //Reply with list of songs, no whitelist required.
        message.channel.send('Songs: ' + songs.map(x => x.replace('.mp3', '')).join(', '))
        message.delete(1000);
    } else if (message.content.toLowerCase() == 'random') {
        //Play a random song is author is admin or user.
        if (isAdmin || isUser) {
            lib.playSound(config.bot.audioFolder + _.sample(songs), message.member.voiceChannel);
            message.delete(1000);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (_.contains(songs, message.content.toLowerCase() + '.mp3')) {
        //Play specific song if author is admin or user.
        if (isAdmin || isUser) {
            lib.playSound(config.bot.audioFolder + message.content.toLowerCase() + '.mp3', message.member.voiceChannel);
            message.delete(1000);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.startsWith('yt https://www.youtube.com/watch?v=')) {
        //Download and play youtube song if author is admin or user.
        if (isAdmin || isUser) {
            lib.downLoadFromYoutubeAndPlay(message);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.author.id == client.user.id) {
        //If message is by the bot, don't do anything.
    } else {
        //React with random emoji on all other messages.
        lib.reactRandom(message);
    }
});

client.login(config.bot.key).then(
    console.log('Bot is ready!')
).catch(
    (error) => {
        console.log(error);
    }
);