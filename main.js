const emojis = ['😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '😨', '😱', '😳', '😡', '😠', '😤', '😭', '😢', '😩', '😫', '😖', '🙁', '😕', '😟', '😔', '😞', '😒', '😏', '😎', '🤓', '😰', '😥', '😓', '🤗', '🖕', '🍆'];
const audioFolder = './audio/';

const Discord = require('discord.js');
const https = require('https');
const fs = require('fs');
const _ = require('underscore');
const fileType = require('file-type');
const youtubedl = require('youtube-dl');
const tempy = require('tempy');
const sleep = require('sleep');
const client = new Discord.Client();

client.on('message', message => {
    var songs = fs.readdirSync(audioFolder);
    // Message has no member, so its a private message
    if(message.member == null && message.attachments != null){
        let attachment = message.attachments.values().next().value
        if(attachment != null){
            downloadAndWriteToFile('audio/' + attachment.filename.toLowerCase(), attachment.url, message.channel)
        }
    }else if(message.content == 'list'){
        message.channel.send('Songs: ' + songs.map(x => x.replace('.mp3', '')).join(', '))
        message.delete(1000);
    }else if(message.content == 'random'){
        playSound(audioFolder + _.sample(songs), message.member.voiceChannel);
        message.delete(1000);
    }else if(_.contains(songs, message.content + '.mp3')){
        playSound(audioFolder + message.content + '.mp3', message.member.voiceChannel);
        message.delete(1000);
    }else if(message.content.startsWith('yt https://www.youtube.com/watch?v=')){
	downLoadFromYoutubeAndPlay(message.content.replace('yt', ''), message.member.voiceChannel);
        message.delete(1000);
    }else{
        reactRandom(message);
    }
});

function reactRandom(message){
    message.react(_.sample(emojis));
}

// Downloads the file at the specified url to the given path.
// Returns true if writing the file succeeds
function downloadAndWriteToFile(path, url, responseChannel){
    if(!fs.existsSync(path)){
        https.get(url, function(response) {
            response.once('data', chunk => {
                if(fileType(chunk).mime == 'audio/mpeg'){
                    response.pipe(fs.createWriteStream(path));
                    responseChannel.send('File uploaded to bot');
                }else{
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
function playSound(filepath, voiceChannel){
    if(voiceChannel != null){
        voiceChannel.join().then(connection => {
            const dispatcher = connection.playFile(filepath);
            client.on('message', message => {
                if(message == 'stop'){
                    dispatcher.end();
                    message.delete(1000);
                }
            });
        });
    }
}

function downLoadFromYoutubeAndPlay(videoLink, voiceChannel){
    let video = youtubedl(videoLink, ['--extract-audio']);
    let tmpVideo = tempy.file({extension: 'mp3'});
    video.pipe(fs.createWriteStream(tmpVideo));

    video.on('end', function(){
	playSound(tmpVideo, voiceChannel)
    });
}

// TODO load key from configuration file
client.login('KEY_HERE');
