const config = require("./config/config");
const lib = require('./bin/lib');
const Discord = require('discord.js');
const fs = require('fs');
const _ = require('underscore');
const client = new Discord.Client();
const request = require('request');

client.on('message', message => {
    let isAdmin = false;
    let isUser = false;

    const userRoles = message.member.roles.array();

    userRoles.forEach(role => {
        if (role.name === config.roles.admin) {
            isAdmin = true;
        }
        if (role.name === config.roles.user) {
            isUser = true;
        }
    })

    //Load list of songs.
    const songs = fs.readdirSync(config.bot.audioFolder);

    if (message.mentions._content == "!upload" && message.attachments != null) {
        //Upload attached file to audio folder
        const attachment = message.attachments.values().next().value
        if (attachment != null) {
            if (isUser || isAdmin) {
                lib.downloadAndWriteToFile(config.bot.audioFolder + attachment.filename.toLowerCase(), attachment.url, message.channel)
            } else {
                message.channel.send('Mag niet! Je bent geen bot user/admin.')
            }
        } else if (message.author.id !== client.user.id) {
            message.channel.send('Mooi man');
        }
    } else if (message.content.toLowerCase() == '!help') {
        if (isAdmin) {
            message.reply('List of commands [admin]: !help, !list, !random, !*song name*, !yt *youtube link*, !delete *song name*').then((responseMessage) => {
                responseMessage.delete(5000);
            });;
        } else if (isUser) {
            message.reply('List of commands [user]: !help, !list, !random, !*song name*, !yt *youtube link*').then((responseMessage) => {
                responseMessage.delete(5000);
            });;
        } else {
            message.reply('List of commands [non-user]: !help, !list').then((responseMessage) => {
                responseMessage.delete(5000);
            });;
        }
        message.delete(1000);
    } else if (message.content.toLowerCase() == '!list') {
        //Reply with list of songs, no whitelist required.
        message.channel.send('Songs: ' + songs.map(x => x.replace('.mp3', '')).join(', '))
        message.delete(1000);
    } else if (message.content.toLowerCase() == '!siebe') {
        //Reply with random chibba
        request('https://fritsbv.nl/random.json', { json: true }, (err, res, body) => {
            if (err) {
                message.reply('Er is iets fout gegaan...').then((responseMessage) => {
                    responseMessage.delete(5000);
                });
                return console.log(err);
            }
            message.channel.send(body.keyword, { tts: true }).then((responseMessage) => {
                responseMessage.delete(5000);
            });
        });
        message.delete(1000);
    } else if (message.content.toLowerCase() == '!siebetoday') {
        //Reply with current chibba
        request('https://fritsbv.nl/today.json', { json: true }, (err, res, body) => {
            if (err) {
                message.reply('Er is iets fout gegaan...').then((responseMessage) => {
                    responseMessage.delete(5000);
                });
                return console.log(err);
            }
            message.channel.send(body.keyword, { tts: true }).then((responseMessage) => {
                responseMessage.delete(5000);
            });
        });
        message.delete(1000);
    } else if (message.content.toLowerCase() == '!random') {
        //Play a random song is author is admin or user.
        if (isAdmin || isUser) {
            const song = _.sample(songs);
            lib.playSound(config.bot.audioFolder + song, message.member.voiceChannel);
            message.reply('Randomly chose ' + song.replace('.mp3', '')).then((responseMessage) => {
                responseMessage.delete(5000);
            });;
            message.delete(1000);
        } else {
            message.reply('Mag niet! Je bent geen bot user/admin.').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (_.contains(songs, message.content.toLowerCase().replace('!', '') + '.mp3') && message.content.startsWith('!')) {
        //Play specific song if author is admin or user.
        if (isAdmin || isUser) {
            const soundName = message.content.replace('!', '').toLowerCase();
            lib.playSound(config.bot.audioFolder + soundName + '.mp3', message.member.voiceChannel);
            message.delete(1000);
        } else {
            message.reply('Mag niet! Je bent geen bot user/admin.').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.startsWith('!yt https://www.youtube.com/watch?v=')) {
        //Download and play youtube song if author is admin or user.
        if (isAdmin || isUser) {
            lib.downLoadFromYoutubeAndPlay(message);
        } else {
            message.reply('Mag niet! Je bent geen bot user/admin.').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.startsWith('!delete ')) {
        //Delete song if author is admin.
        if (isAdmin) {
            lib.deleteSound(message);
        } else {
            message.reply('Mag niet! Je bent geen bot user/admin.').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.toLowerCase().startsWith('!chibba')) {
        lib.reactChibbafied(message);
    } else if (message.author.id == client.user.id) {
        //If message is by the bot, don't do anything.
    } else {
        //React with random emoji on all other messages.
        lib.reactRandom(message);
    }
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('error', (error) => {
    console.log('Error: ', error);
})

client.login(config.bot.key);