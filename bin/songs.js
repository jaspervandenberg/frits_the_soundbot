const fs = require('fs');
const config = require('../config/config');

let songs = [];

module.exports.updateSongs = () => {
  try {
    songs = fs.readdirSync(config.bot.audioFolder);
    return songs;
  } catch (error) {
    console.log(error);
  }
};

module.exports.checkIfExists = (name) => {
  const path = `${config.bot.audioFolder}${name}.mp3`;
  return fs.existsSync(path);
};
