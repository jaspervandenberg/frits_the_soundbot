const fs = require('fs');
const config = require('../config/config');

let songs = [];

module.exports.updateSongs = () => {
  try {
    songs = fs.readdirSync(config.bot.audioFolder);
  } catch (error) {
    console.log(error);
  }
  return songs;
};

module.exports.checkIfExists = (name) => {
  const path = `${config.bot.audioFolder}${name}.mp3`;
  return fs.existsSync(path);
};
