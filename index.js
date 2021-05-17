require('dotenv').config();
require('./src/configuration/environment');

const clear = require('clear');
const figlet = require('figlet');
const chalk = require('chalk');

const { getCachedLists, getCachedLabels } = require('./src/service/board-service');
const { mainMenu } = require('./src/service/cli/main-menu-service');

clear();

console.log(
  chalk.yellow(
    figlet.textSync('trellog', { horizontalLayout: 'full' })
  )
);

(async () => {
  const lists = await getCachedLists();
  const labels = await getCachedLabels();
  
  await mainMenu(lists, labels);
})();