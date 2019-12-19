const config = require("./config/config");
const lib = require('./bin/lib');

const Discord = require('discord.js');
const fs = require('fs');
const _ = require('underscore');
const client = new Discord.Client();

client.on('message', message => {
    let isAdmin = lib.checkIfAdmin(message.author.id);
    let isUser = lib.checkIfUser(message.author.id);

    var songs = fs.readdirSync(config.bot.audioFolder);
    // Message has no member, so its a private message
    if (message.member == null && message.attachments != null) {
        let attachment = message.attachments.values().next().value
        if (attachment != null) {
            lib.downloadAndWriteToFile(config.bot.audioFolder + attachment.filename.toLowerCase(), attachment.url, message.channel)
        }
    } else if (message.content.toLowerCase() == 'list') {
        message.channel.send('Songs: ' + songs.map(x => x.replace('.mp3', '')).join(', '))
        message.delete(1000);
    } else if (message.content.toLowerCase() == 'random') {
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
        if (isAdmin || isUser) {
            lib.downLoadFromYoutubeAndPlay(message);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.author.id == client.user.id) {
        //Do nothing
    } else {
        lib.reactRandom(message);
    }
});

client.login(config.bot.key);