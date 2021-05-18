const fs = require('fs');

const getGameNamesFromFile = (filePath) => fs.readFileSync(filePath, { encoding: 'utf-8' }).split(/\r?\n/g);

module.exports = { getGameNamesFromFile };