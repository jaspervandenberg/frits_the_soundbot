const config = require("./config/config");

const Discord = require('discord.js');
const https = require('https');
const fs = require('fs');
const _ = require('underscore');
const youtubeDownloader = require('youtube-mp3-downloader');
const fileType = require('file-type');
const client = new Discord.Client();

client.on('message', message => {
    var songs = fs.readdirSync(config.bot.audioFolder);
    // Message has no member, so its a private message
    if (message.member == null && message.attachments != null) {
        let attachment = message.attachments.values().next().value
        if (attachment != null) {
            downloadAndWriteToFile(config.bot.audioFolder + attachment.filename.toLowerCase(), attachment.url, message.channel)
        }
    } else if (message.content == 'list') {
        message.channel.send('Songs: ' + songs.map(x => x.replace('.mp3', '')).join(', '))
        message.delete(1000);
    } else if (message.content == 'random') {
        playSound(config.bot.audioFolder + _.sample(songs), message.member.voiceChannel);
        message.delete(1000);
    } else if (_.contains(songs, message.content + '.mp3')) {
        playSound(config.bot.audioFolder + message.content + '.mp3', message.member.voiceChannel);
        message.delete(1000);
    } else if (message.content.startsWith('yt https://www.youtube.com/watch?v=')) {
        downLoadFromYoutubeAndPlay(message);
    } else if (message.content.startsWith('Progress ')) {
        //Do nothing
    } else {
        reactRandom(message);
    }
});

function reactRandom(message) {
    message.react(_.sample(config.bot.emojis));
}

// Downloads the file at the specified url to the given path.
// Returns true if writing the file succeeds
function downloadAndWriteToFile(path, url, responseChannel) {
    if (!fs.existsSync(path)) {
        https.get(url, function (response) {
            response.once('data', chunk => {
                if (fileType(chunk).mime == 'audio/mpeg') {
                    response.pipe(fs.createWriteStream(path));
                    responseChannel.send('File uploaded to bot');
                } else {
                    responseChannel.send('Uploading file failed, are you sure its an mp3 file?');
                }
            });
        });
    } else {
        responseChannel.send('File already exists, dumbass');
    }
    return true;
}

// Plays the given file into the specified voiceChannel.
function playSound(filepath, voiceChannel) {
    if (voiceChannel != null) {
        voiceChannel.join().then(connection => {
            const dispatcher = connection.playFile(filepath);
        }).catch(err => {
            console.log(err);
        });
    }
}

function downLoadFromYoutubeAndPlay(message) {
    var YD = new youtubeDownloader({
        "ffmpegPath": config.bot.ffmpegPath,        // Where is the FFmpeg binary located?
        "outputPath": config.bot.audioFolder,       // Where should the downloaded and encoded files be stored?
        "youtubeVideoQuality": "highest",           // What video quality should be used?
        "queueParallelism": 1,                      // How many parallel downloads/encodes should be started?
        "progressTimeout": 2000                     // How long should be the interval of the progress reports
    });

    let videoId = message.content.replace('yt https://www.youtube.com/watch?v=', '');
    let voiceChannel = message.member.voiceChannel;

    //Start youtube download
    YD.download(videoId);

    //On every 'progress' event. Send message with %
    YD.on("progress", (progress) => {
        message.channel.send('Progress ' + Math.round(progress.progress.percentage) + '%')
            .then(
                (progressMessage) => {
                    progressMessage.delete(2000).catch((error) => { console.log(error); });
                }
            ).catch(
                (err) => {
                    console.log(err);
                }
            )
    });

    YD.on("error", (error, data) => {
        message.channel.send('Er is iets fout gegaan, iets met copyright ofzo');
    });

    //When download is finished, play the file
    YD.on("finished", (err, data) => {
        message.delete(1000).catch((error) => { console.log(error); });

        if (voiceChannel != null) {
            voiceChannel.join().then(connection => {
                let dispatcher = connection.playFile(data.file);

                dispatcher.on('end', () => {
                    fs.unlink(data.file, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Temp file deleted');
                        }
                    })
                })
            }).catch(err => {
                console.log(err);
            });
        }
    });
}

client.login(config.bot.key);