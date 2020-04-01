const config = require("../config/config");
const youtubeDownloader = require('youtube-mp3-downloader');
const https = require('https');
const fs = require('fs');
const _ = require('underscore');
const fileType = require('file-type');

module.exports.reactRandom = (message) => {
    message.react(_.sample(config.bot.emojis));
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
            const dispatcher = connection.playFile(filepath);
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
                    responseMessage.delete(5000);
                });
                message.delete(1000);
                console.log(err);
            } else {
                message.reply(soundName + ' is verwijderd.').then((responseMessage) => {
                    responseMessage.delete(5000);
                });
                message.delete(1000);
                console.log(message.author.username + ' heeft ' + soundName + ' verwijderd.');
            }
        })
    } else {
        message.reply('Dat bestand bestaat niet').then((responseMessage) => {
            responseMessage.delete(5000);
        });
        message.delete(1000);
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
    const voiceChannel = message.member.voiceChannel;

    //Start youtube download
    YD.download(videoId);

    //On every 'progress' event. Send message with %
    YD.on("progress", (progress) => {
        message.reply('Download progress ' + Math.round(progress.progress.percentage) + '%')
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

    //When an error is emitted, send a message to the authors textChannel.
    YD.on("error", (error) => {
        console.log(error);
        message.reply('Er is iets fout gegaan: ' + error).then(
            (progressMessage) => {
                progressMessage.delete(5000).catch((error) => { console.log(error); });
            }
        );
        message.delete(2000).catch((error) => { console.log(error); });
    });

    //When download is finished, play the file
    YD.on("finished", (err, data) => {
        message.delete(1000).catch((error) => { console.log(error); });

        if (voiceChannel != null) {
            voiceChannel.join().then(connection => {
                const dispatcher = connection.playFile(data.file);

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