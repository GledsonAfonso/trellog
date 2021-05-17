require('dotenv').config();
require('./src/configuration/environment');

const clear = require('clear');
const figlet = require('figlet');
const chalk = require('chalk');

const { mainMenu } = require('./src/service/cli/main-menu-service');
const { getLists } = require('./src/service/trello-service');

clear();

console.log(
  chalk.yellow(
    figlet.textSync('trellog', { horizontalLayout: 'full' })
  )
);

(async () => {
  const lists = await getLists();
  const list_names = lists?.map(it => it.name);
  
  await mainMenu(list_names);
})();