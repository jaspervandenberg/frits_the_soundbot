const emojis = ['😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '😨', '😱', '😳', '😡', '😠', '😤', '😭', '😢', '😩', '😫', '😖', '🙁', '😕', '😟', '😔', '😞', '😒', '😏', '😎', '🤓', '😰', '😥', '😓', '🤗', '🖕', '🍆'];
const audioFolder = './audio/';

import { Client } from 'discord.js';
import { get } from 'https';
import { readdirSync, existsSync, createWriteStream } from 'fs';
import { sample, contains } from 'underscore';
import fileType from 'file-type';

const client = new Client();

client.on('message', message => {
    var songs = readdirSync(audioFolder);
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
        playSound(audioFolder + sample(songs), message.member.voiceChannel);
        message.delete(1000);
    }else if(contains(songs, message.content + '.mp3')){
        playSound(audioFolder + message.content + '.mp3', message.member.voiceChannel);
        message.delete(1000);
    }else{
        reactRandom(message);
    }
});

function reactRandom(message){
    message.react(sample(emojis));
}

function sleep(time){
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Downloads the file at the specified url to the given path.
// Returns true if writing the file succeeds
function downloadAndWriteToFile(path, url, responseChannel){
    if(!existsSync(path)){
        get(url, function(response) {
            response.once('data', chunk => {
                if(fileType(chunk).mime == 'audio/mpeg'){
                    response.pipe(createWriteStream(path));
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

            dispatcher.on("end", end => {
                //voiceChannel.leave();
            });
        });
    }
}

// TODO load key from configuration file
client.login('KEY_HERE');