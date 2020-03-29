const config = require("./config/config");
const lib = require('./bin/lib');
const Discord = require('discord.js');
const fs = require('fs');
const _ = require('underscore');
const client = new Discord.Client();
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./config/db.json')
const db = low(adapter)

db.defaults({ users: [], admins: [] })
    .write()

client.on('message', message => {
    //Check if author is an admin or user. 
    const isAdmin = db.get('admins').value().includes(message.author.id);
    const isUser = db.get('users').value().includes(message.author.id);

    //Load list of songs.
    const songs = fs.readdirSync(config.bot.audioFolder);

    if (message.member == null && message.attachments != null) {
        // Message has no member, so its a private message.
        const attachment = message.attachments.values().next().value
        if (attachment != null) {
            lib.downloadAndWriteToFile(config.bot.audioFolder + attachment.filename.toLowerCase(), attachment.url, message.channel)
        } else if (message.author.id !== client.user.id) {
            message.channel.send('Mooi man');
        }
    } else if (message.content.toLowerCase() == '!help') {
        if (isAdmin) {
            message.channel.send('List of commands [admin]: !help, !admin *@user*, !user *@user*, !list, !random, !*song name*, !yt *youtube link*, !delete *song name*').then((responseMessage) => {
                responseMessage.delete(5000);
            });;
        } else if (isUser) {
            message.channel.send('List of commands [user]: !help, !list, !random, !*song name*, !yt *youtube link*').then((responseMessage) => {
                responseMessage.delete(5000);
            });;
        } else {
            message.channel.send('List of commands [non-user]: !help, !list').then((responseMessage) => {
                responseMessage.delete(5000);
            });;
        }
        message.delete(1000);
    } else if (message.content.toLowerCase() == '!list') {
        //Reply with list of songs, no whitelist required.
        message.channel.send('Songs: ' + songs.map(x => x.replace('.mp3', '')).join(', '))
        message.delete(1000);
    } else if (message.content.toLowerCase() == '!random') {
        //Play a random song is author is admin or user.
        if (isAdmin || isUser) {
            const song = _.sample(songs);
            lib.playSound(config.bot.audioFolder + song, message.member.voiceChannel);
            message.channel.send('Randomly chose ' + song.replace('.mp3', '')).then((responseMessage) => {
                responseMessage.delete(5000);
            });;
            message.delete(1000);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.toLowerCase().startsWith('!admin')) {
        //Adds all @ mentioned users to the admin group.
        if (isAdmin) {
            const users = Array.from(message.mentions.users.values());
            if (users.length > 0) {
                for (var i = 0; i < users.length; i++) {
                    if (db.get('admins').value().includes(users[i].id)) {
                        message.channel.send(users[i].username + ' is al een admin.').then((responseMessage) => {
                            responseMessage.delete(5000);
                        });;
                    } else {
                        db.get('admins')
                            .push(users[i].id)
                            .write()

                        message.channel.send(users[i].username + ' is nu een admins.').then((responseMessage) => {
                            responseMessage.delete(10000);
                        });;
                    }
                }
            } else {
                message.channel.send('Niemand is genoemd...').then((responseMessage) => {
                    responseMessage.delete(5000);
                });;
            }
            message.delete(1000);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.toLowerCase().startsWith('!user')) {
        //Adds all @ mentioned users to the user group.
        if (isAdmin) {
            const users = Array.from(message.mentions.users.values());
            if (users.length > 0) {
                for (var i = 0; i < users.length; i++) {
                    if (db.get('users').value().includes(users[i].id)) {
                        message.channel.send(users[i].username + ' is al een user.').then((responseMessage) => {
                            responseMessage.delete(5000);
                        });;
                    } else {
                        db.get('users')
                            .push(users[i].id)
                            .write()

                        message.channel.send(users[i].username + ' is nu een user.').then((responseMessage) => {
                            responseMessage.delete(10000);
                        });;
                    }
                }
            } else {
                message.channel.send('Niemand is genoemd...').then((responseMessage) => {
                    responseMessage.delete(5000);
                });;
            }
            message.delete(1000);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (_.contains(songs, message.content.toLowerCase().replace('!', '') + '.mp3') && message.content.startsWith('!')) {
        //Play specific song if author is admin or user.
        if (isAdmin || isUser) {
            let soundName = message.content.replace('!', '').toLowerCase();
            lib.playSound(config.bot.audioFolder + soundName + '.mp3', message.member.voiceChannel);
            message.delete(1000);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.startsWith('!yt https://www.youtube.com/watch?v=')) {
        //Download and play youtube song if author is admin or user.
        if (isAdmin || isUser) {
            lib.downLoadFromYoutubeAndPlay(message);
        } else {
            message.channel.send('MAG NIET! Je staat niet op de whitelist!').then((responseMessage) => {
                responseMessage.delete(5000);
            });
            message.delete(1000);
        }
    } else if (message.content.startsWith('!delete ')) {
        //Delete song if author is admin.
        if (isAdmin) {
            lib.deleteSound(message);
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

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('error', (error) => {
    console.log('Error: ', error);
})

client.login(config.bot.key);
