const inquirer = require('inquirer');

const { createGameCardFor } = require('../game-service');

const MainMenuSteps = {
  INSERT_NEW_GAME_CARD: 'Insert a new game card',
  EXIT: 'Exit'
};

const _act = async (answers) => {
  switch (answers?.mainMenu) {
    case MainMenuSteps.INSERT_NEW_GAME_CARD:
      if (answers?.chooseListName) {
        console.log('Inserting new card...');
        const { status } = await createGameCardFor({ name: answers?.insertNewGameCard, listName: answers?.chooseListName });
  
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

const mainMenu = async (list_names) => {
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
      name: 'chooseListName',
      message: 'Add it in which list?',
      choices: list_names,
      default: list_names.find(it => it.toLowerCase().includes('temp')),
      when: (answers) => answers?.mainMenu === MainMenuSteps.INSERT_NEW_GAME_CARD
    }
  ];

  while (true) {
    await inquirer
      .prompt(prompts)
      .then(_act);
  }
};

module.exports = { mainMenu };