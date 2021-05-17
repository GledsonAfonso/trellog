const inquirer = require('inquirer');

const { createGameCardFor } = require('../game-service');

const MainMenuSteps = {
  INSERT_NEW_GAME_CARD: 'Insert a new game card',
  EXIT: 'Exit'
};

const _act = async (answers) => {
  switch (answers?.mainMenu) {
    case MainMenuSteps.INSERT_NEW_GAME_CARD:
      if (answers?.chooseList && answers?.chooseLabel) {
        console.log('Inserting new card...');
        const { status } = await createGameCardFor({ name: answers.insertNewGameCard, listName: answers.chooseList, labelNames: answers.chooseLabel });
  
        if (status === 200) {
          console.log('Card inserted!');
        } else {
          console.log(`Card not inserted! Error code: ${status}`);
        }
      }
      break;
    default:
      console.log('Exiting...');
      process.exit(0);
  }
};

const mainMenu = async (lists = [], labels = []) => {
  const listNames = lists.map(it => it.name);
  const labelNames = labels.map(it => it.name);

  const prompts = [
    {
      type: 'list',
      name: 'mainMenu',
      message: 'What would you want to do?',
      choices: [
        MainMenuSteps.INSERT_NEW_GAME_CARD,
        MainMenuSteps.EXIT
      ]
    },
    {
      type: 'input',
      name: 'insertNewGameCard',
      message: 'Type the name of the game: ',
      when: (answers) => answers?.mainMenu === MainMenuSteps.INSERT_NEW_GAME_CARD
    },
    {
      type: 'list',
      name: 'chooseList',
      message: 'Add it in which list?',
      choices: listNames,
      default: listNames.find(it => it.toLowerCase().includes('temp')),
      when: (answers) => answers?.mainMenu === MainMenuSteps.INSERT_NEW_GAME_CARD && listNames?.length > 0
    },
    {
      type: 'checkbox',
      name: 'chooseLabel',
      message: 'With which label?',
      choices: labelNames,
      default: labelNames.find(it => it.toLowerCase().includes('steam')),
      when: (answers) => answers?.mainMenu === MainMenuSteps.INSERT_NEW_GAME_CARD && labelNames?.length > 0
    }
  ];

  while (true) {
    await inquirer
      .prompt(prompts)
      .then(_act);
  }
};

module.exports = { mainMenu };