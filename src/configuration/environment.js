const env = process.env;

const environment = {
    timeout: env.TIMEOUT,
    trello_api_key: env.TRELLO_API_KEY,
    trello_api_token: env.TRELLO_API_TOKEN,
    trello_board_id: env.TRELLO_BOARD_ID,
};

module.exports = { ...environment };