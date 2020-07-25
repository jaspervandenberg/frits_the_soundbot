const config = require("../config/config");
const youtubeDownloader = require('youtube-mp3-downloader');
const https = require('https');
const fs = require('fs');
const _ = require('underscore');
const fileType = require('file-type');
const request = require('request');
const main = require('../main');

module.exports.reactRandom = (message) => {
    message.react(_.sample(config.bot.emojis));
}

module.exports.reactChibbafied = (message) => {
    const string = message.content.replace('!chibba ', '');
    const aids_level = -1;
    const params = { string: string, aids_level: aids_level }
    request({ url: 'https://fritsbv.nl/chibbify.json', qs: params }, (err, res, body) => {
        if (err) {
            message.reply('Er is iets fout gegaan...').then((responseMessage) => {
                responseMessage.delete({ timeout: 5000 });
            });
            return console.log(err);
        }
        console.log(body);
        var data = JSON.parse(body);
        var content = data.keyword;
        message.channel.send(content, { tts: true }).then((responseMessage) => {
        });
    });
    message.delete({ timeout: 1000 });
}

// Downloads the file at the specified url to the given path.
// Returns true if writing the file succeeds
module.exports.downloadAndWriteToFile = (path, url, responseChannel) => {
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
module.exports.playSound = (filepath, voiceChannel) => {
    if (voiceChannel != null) {
        voiceChannel.join().then(connection => {
            const broadcast = main.client.voice.createBroadcast();
            broadcast.play(filepath);
            connection.play(broadcast);
        }).catch(err => {
            console.log(err);
        });
    }
}

//Delete specified song
module.exports.deleteSound = (message) => {
    const soundName = message.content.replace('!delete ', '');
    const soundPath = config.bot.audioFolder + soundName + '.mp3';
    if (fs.existsSync(soundPath)) {
        fs.unlink(soundPath, (err) => {
            if (err) {
                message.reply('Er is iets fout gegaan...').then((responseMessage) => {
                    responseMessage.delete({ timeout: 5000 });
                });
                message.delete({ timeout: 1000 });
                console.log(err);
            } else {
                message.reply(soundName + ' is verwijderd.').then((responseMessage) => {
                    responseMessage.delete({ timeout: 5000 });
                });
                message.delete({ timeout: 1000 });
                console.log(message.author.username + ' heeft ' + soundName + ' verwijderd.');
            }
        })
    } else {
        message.reply('Dat bestand bestaat niet').then((responseMessage) => {
            responseMessage.delete({ timeout: 5000 });
        });
        message.delete({ timeout: 1000 });
    }
}

//Gets the video ID from the message, downloads the video to MP3 then plays it in the authors voiceChannel.
module.exports.downLoadFromYoutubeAndPlay = (message) => {
    var YD = new youtubeDownloader({
        "ffmpegPath": config.bot.ffmpegPath,        // Where is the FFmpeg binary located?
        "outputPath": config.bot.audioFolder,       // Where should the downloaded and encoded files be stored?
        "youtubeVideoQuality": "highest",           // What video quality should be used?
        "queueParallelism": 1,                      // How many parallel downloads/encodes should be started?
        "progressTimeout": 2000                     // How long should be the interval of the progress reports
    });

    const videoId = message.content.replace('!yt https://www.youtube.com/watch?v=', '');
    const voiceChannel = message.member.voice.channel;

    //Start youtube download
    YD.download(videoId);

    //On every 'progress' event. Send message with %
    YD.on("progress", (progress) => {
        message.reply('Download progress ' + Math.round(progress.progress.percentage) + '%')
            .then(
                (progressMessage) => {
                    progressMessage.delete({ timeout: 2000 }).catch((error) => { console.log(error); });
                }
            ).catch(
                (err) => {
                    console.log(err);
                }
            )
    });

    //When an error is emitted, send a message to the authors textChannel.
    YD.on("error", (error) => {
        console.log(error);
        message.reply('Er is iets fout gegaan: ' + error).then(
            (progressMessage) => {
                progressMessage.delete({ timeout: 5000 }).catch((error) => { console.log(error); });
            }
        );
        message.delete(2000).catch((error) => { console.log(error); });
    });

    //When download is finished, play the file
    YD.on("finished", (err, data) => {
        message.delete({ timeout: 1000 }).catch((error) => { console.log(error); });

        if (voiceChannel != null) {
            voiceChannel.join().then(connection => {
                const broadcast = main.client.voice.createBroadcast();
                broadcast.play(data.file);
                connection.play(broadcast);

                broadcast.on('unsubscribe', () => {
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