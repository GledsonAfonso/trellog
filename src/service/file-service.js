const fs = require('fs');

const getGameNamesFromFile = (filePath) => fs.readFileSync(filePath, { encoding: 'utf-8' }).split(/\r?\n/g);
const writeGameNamesInFile = (names) => fs.writeFileSync(`${__dirname}/../../games_still_without_description.txt`, JSON.stringify(names), { encoding: 'utf-8' });

module.exports = { getGameNamesFromFile, writeGameNamesInFile };