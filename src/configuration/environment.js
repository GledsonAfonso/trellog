const env = process.env;

const environment = {
    timeout: env.TIMEOUT,
    trelloApiKey: env.TRELLO_API_KEY,
    trelloApiToken: env.TRELLO_API_TOKEN,
    trelloBoardId: env.TRELLO_BOARD_ID,
};

module.exports = { ...environment };