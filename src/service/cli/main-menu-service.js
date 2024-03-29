const inquirer = require('inquirer');
const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt');

const { createGameCardFor, updateGameCardsWithoutDescription } = require('../game-service');
const { getGameNamesFromFile } = require('../file-service');

const MainMenuSteps = {
  INSERT_NEW_GAME_CARD: 'Insert a new game card',
  INSERT_NEW_GAME_CARDS_USING_FILE: 'Insert new game cards using a file',
  UPDATE_CARDS_WITH_EMPTY_DESCRIPTION: 'Update cards with empty description',
  EXIT: 'Exit'
};

const addCard = async (name, listName, labelNames) => {
  console.log(`Inserting new card for ${name}...`);
  const { status } = await createGameCardFor({ name, listName, labelNames });

  if (status === 200) {
    console.log(`Card for ${name} inserted!`);
  } else {
    console.log(`Card not inserted for ${name}! Error code: ${status}`);
  }
};

const _act = async (answers) => {
  switch (answers?.mainMenu) {
    case MainMenuSteps.INSERT_NEW_GAME_CARD:
      if (answers?.chooseList && answers?.chooseLabel) {
        await addCard(answers.insertNewGameCard, answers.chooseList, answers.chooseLabel);
      }
      break;
    case MainMenuSteps.INSERT_NEW_GAME_CARDS_USING_FILE:
      const filePath = answers.insertNewGameCardsUsingFile;
      const names = getGameNamesFromFile(filePath);

      const promises = names.map(name => addCard(name));
      await Promise.all(promises);
      break;
    case MainMenuSteps.UPDATE_CARDS_WITH_EMPTY_DESCRIPTION:
      await updateGameCardsWithoutDescription();
      break;
    default:
      console.log('Exiting...');
      process.exit(0);
  }
};

const mainMenu = async (lists = [], labels = []) => {
  const listNames = lists.map(it => it.name);
  const labelNames = labels.map(it => it.name).sort();

  const prompts = [
    {
      type: 'list',
      name: 'mainMenu',
      message: 'What would you want to do?',
      choices: [
        MainMenuSteps.INSERT_NEW_GAME_CARD,
        MainMenuSteps.INSERT_NEW_GAME_CARDS_USING_FILE,
        MainMenuSteps.UPDATE_CARDS_WITH_EMPTY_DESCRIPTION,
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
      when: (answers) => answers?.mainMenu === MainMenuSteps.INSERT_NEW_GAME_CARD && labelNames?.length > 0
    },
    {
      type: 'file-tree-selection',
      name: 'insertNewGameCardsUsingFile',
      message: 'Choose the path to the file: ',
      root: './',
      when: (answers) => answers?.mainMenu === MainMenuSteps.INSERT_NEW_GAME_CARDS_USING_FILE
    }
  ];

  inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

  while (true) {
    await inquirer
      .prompt(prompts)
      .then(_act);
  }
};

module.exports = { mainMenu };