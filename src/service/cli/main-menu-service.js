const inquirer = require('inquirer');

const { createGameCardFor } = require('../game-service');

const MainMenuChoice = {
  INSERT_NEW_GAME_CARD: 'Insert a new game card',
  EXIT: 'Exit'
};

const prompts = [
  {
    type: 'list',
    name: 'mainMenu',
    message: 'What would you want to do?',
    choices: [
      MainMenuChoice.INSERT_NEW_GAME_CARD,
      MainMenuChoice.EXIT
    ]
  },
  {
    type: 'input',
    name: 'insertNewGameCard',
    message: 'Type the name of the game: ',
    when: (answers) => answers?.mainMenu === MainMenuChoice.INSERT_NEW_GAME_CARD
  }
];

const _act = async (answers) => {
  switch (answers?.mainMenu) {
    case MainMenuChoice.INSERT_NEW_GAME_CARD:
      console.log('Inserting new card...');
      const { status } = await createGameCardFor({ name: answers?.insertNewGameCard });
  
      if (status === 200) {
        console.log('Card inserted!');
      } else {
        console.log(`Card not inserted! Error code: ${status}`);
      }
  
      break;
    default:
      console.log('Exiting...');
      break;
  }
};

const mainMenu = () => {
  inquirer
    .prompt(prompts)
    .then(_act);
};

module.exports = { mainMenu };