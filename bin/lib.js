/* eslint-disable no-console */
const YoutubeDownloader = require('youtube-mp3-downloader');
const https = require('https');
const fs = require('fs');
const _ = require('underscore');
const fileType = require('file-type');
const request = require('request');
const {
  MessageEmbed,
} = require('discord.js');
const main = require('../main');
const config = require('../config/config');
const songs = require('./songs');

module.exports.reactRandom = (message) => {
  message.react(_.sample(config.bot.emojis));
};

module.exports.reactChibbafied = (message) => {
  const string = message.content.replace('!chibba ', '');
  const aidsLevel = -1;
  const params = {
    string,
    aids_level: aidsLevel,
  };
  try {
    request({
      url: 'https://fritsbv.nl/chibbify.json',
      qs: params,
    }, (err, res, body) => {
      if (err) {
        throw new Error(err);
      }
      const data = JSON.parse(body);
      const content = data.keyword;
      message.channel.send(content, {
        tts: true,
      });
    });
    message.delete({
      timeout: 1000,
    });
  } catch (error) {
    if (error) {
      message.reply('Er is iets fout gegaan...').then((responseMessage) => {
        responseMessage.delete({
          timeout: 5000,
        });
      });
    }
  }
};

module.exports.chibba = (message) => {
  try {
    request('https://fritsbv.nl/random.json', {
      json: true,
    }, (err, res, body) => {
      if (err) {
        throw new Error(err);
      }
      message.channel.send(body.keyword, {
        tts: true,
      }).then((responseMessage) => {
        responseMessage.delete({
          timeout: 5000,
        });
      });
    });
    message.delete({
      timeout: 1000,
    });
  } catch (error) {
    this.errorMessage(message);
  }
};

module.exports.chibbaToday = (message) => {
  try {
    request('https://fritsbv.nl/today.json', {
      json: true,
    }, (err, res, body) => {
      if (err) {
        throw new Error(err);
      }
      message.channel.send(body.keyword, {
        tts: true,
      }).then((responseMessage) => {
        responseMessage.delete({
          timeout: 5000,
        });
      });
    });
    message.delete({
      timeout: 1000,
    });
  } catch (error) {
    this.errorMessage(message);
  }
};

// Downloads the file at the specified url to the given path.
// Returns true if writing the file succeeds
module.exports.downloadAndWriteToFile = (path, url, responseChannel) => {
  if (!fs.existsSync(path)) {
    try {
      https.get(url, (response) => {
        response.once('data', (chunk) => {
          if (fileType(chunk).mime === 'audio/mpeg') {
            response.pipe(fs.createWriteStream(path));
            responseChannel.send('File uploaded to bot');
          } else {
            responseChannel.send('Uploading file failed, are you sure its an mp3 file?');
          }
        });
      });
    } catch (error) {
      responseChannel.send('Something went wrong...');
    }
  } else {
    responseChannel.send('File already exists, dumbass');
  }
  return true;
};

// Reply with list of commands based on role
module.exports.helpMessage = (message, isAdmin, isUser) => {
  if (isAdmin) {
    message.reply('List of commands [admin]: !help, !list, !random, !*song name*, !siebe, !siebe_today, !chibba *text*, !yt *youtube link*, !delete *song name*').then((responseMessage) => {
      responseMessage.delete({
        timeout: 5000,
      });
    });
  } else if (isUser) {
    message.reply('List of commands [user]: !help, !list, !random, !*song name*, !siebe, !siebe_today, !chibba *text*, !yt *youtube link*').then((responseMessage) => {
      responseMessage.delete({
        timeout: 5000,
      });
    });
  } else {
    message.reply('List of commands [non-user]: !help, !list').then((responseMessage) => {
      responseMessage.delete({
        timeout: 5000,
      });
    });
  }
  message.delete({
    timeout: 1000,
  });
};

module.exports.unAuthMessage = (message) => {
  message.reply('Mag niet! Je bent geen bot user/admin.').then((responseMessage) => {
    responseMessage.delete({
      timeout: 5000,
    });
  });
  message.delete({
    timeout: 1000,
  });
};

module.exports.errorMessage = (message) => {
  message.reply('Er is iets fout gegaan...').then((responseMessage) => {
    responseMessage.delete({
      timeout: 5000,
    });
  });
};

module.exports.listSounds = (message) => {
  try {
    // Reply with list of songs, no whitelist required.
    const songString = songs.updateSongs().map((x) => x.replace('.mp3', '')).join(', ');
    const messageEmbed = new MessageEmbed();
    messageEmbed.setDescription(songString);
    messageEmbed.setTitle('List of sounds');
    message.channel.send(messageEmbed);
    // message.channel.send(`Songs: ${songString}`);
    message.delete({
      timeout: 1000,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.playSpecificSong = (message) => {
  const soundName = message.content.replace('!', '').toLowerCase();
  this.playSound(`${config.bot.audioFolder + soundName}.mp3`, message.member.voice.channel);
  message.delete({
    timeout: 1000,
  });
};

module.exports.playRandomSong = (message) => {
  // Play a random song is author is admin or user.
  const song = _.sample(songs.updateSongs());
  this.playSound(config.bot.audioFolder + song, message.member.voice.channel);
  message.reply(`Randomly chose ${song.replace('.mp3', '')}`).then((responseMessage) => {
    responseMessage.delete({
      timeout: 5000,
    });
  });
  message.delete({
    timeout: 1000,
  });
};

// Plays the given file into the specified voiceChannel.
module.exports.playSound = (filepath, voiceChannel) => {
  if (voiceChannel != null) {
    voiceChannel.join().then((connection) => {
      const broadcast = main.client.voice.createBroadcast();
      broadcast.play(filepath);
      connection.play(broadcast);
    }).catch((err) => {
      console.error(err);
    });
  }
};

module.exports.uploadSound = (message) => {
  // Upload attached file to audio folder
  const attachment = message.attachments.values().next().value;
  if (attachment != null) {
    const file = config.bot.audioFolder + attachment.name.toLowerCase();
    this.downloadAndWriteToFile(file, attachment.url, message.channel);
  } else if (message.author.id !== main.client.user.id) {
    message.channel.send('Mooi man');
  }
};

// Delete specified song
module.exports.deleteSound = (message) => {
  const soundName = message.content.replace('!delete ', '');
  const soundPath = `${config.bot.audioFolder + soundName}.mp3`;
  if (fs.existsSync(soundPath)) {
    fs.unlink(soundPath, (err) => {
      if (err) {
        message.reply('Er is iets fout gegaan...').then((responseMessage) => {
          responseMessage.delete({
            timeout: 5000,
          });
        });
        message.delete({
          timeout: 1000,
        });
        console.error(err);
      } else {
        message.reply(`${soundName} is verwijderd.`).then((responseMessage) => {
          responseMessage.delete({
            timeout: 5000,
          });
        });
        message.delete({
          timeout: 1000,
        });
        console.error(`${message.author.username}  heeft ${soundName} verwijderd.`);
      }
    });
  } else {
    message.reply('Dat bestand bestaat niet').then((responseMessage) => {
      responseMessage.delete({
        timeout: 5000,
      });
    });
    message.delete({
      timeout: 1000,
    });
  }
};

// Gets the video ID from the message, downloads the video, plays it in the authors voiceChannel.
module.exports.downLoadFromYoutubeAndPlay = (message) => {
  const YD = new YoutubeDownloader({
    ffmpegPath: config.bot.ffmpegPath, // Where is the FFmpeg binary located?
    outputPath: config.bot.audioFolder, // Where should the downloaded and encoded files be stored?
    youtubeVideoQuality: 'highest', // What video quality should be used?
    queueParallelism: 1, // How many parallel downloads/encodes should be started?
    progressTimeout: 2000, // How long should be the interval of the progress reports
  });

  const videoId = message.content.replace('!yt https://www.youtube.com/watch?v=', '');
  const voiceChannel = message.member.voice.channel;

  // Start youtube download
  YD.download(videoId);

  // On every 'progress' event. Send message with %
  YD.on('progress', (progress) => {
    message.reply(`Download progress ${Math.round(progress.progress.percentage)}%`)
      .then(
        (progressMessage) => {
          progressMessage.delete({
            timeout: 2000,
          }).catch((error) => {
            console.error(error);
          });
        },
      ).catch(
        (err) => {
          console.error(err);
        },
      );
  });

  // When an error is emitted, send a message to the authors textChannel.
  YD.on('error', (error) => {
    console.error(error);
    message.reply(`Er is iets fout gegaan: ${error}`).then(
      (progressMessage) => {
        progressMessage.delete({
          timeout: 5000,
        }).catch((err) => {
          console.error(err);
        });
      },
    );
    message.delete({
      timeout: 2000,
    }).catch((err) => {
      console.error(err);
    });
  });

  // When download is finished, play the file
  YD.on('finished', (err, data) => {
    message.delete({
      timeout: 1000,
    }).catch((error) => {
      console.error(error);
    });

    if (voiceChannel != null) {
      voiceChannel.join().then((connection) => {
        const broadcast = main.client.voice.createBroadcast();
        broadcast.play(data.file);
        connection.play(broadcast);

        broadcast.on('unsubscribe', () => {
          fs.unlink(data.file, (unlinkError) => {
            if (err) {
              console.error(unlinkError);
            }
          });
        });
      }).catch((error) => {
        console.error(error);
      });
    }
  });
};
