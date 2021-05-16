const joi = require('joi');

const environmentSchema = joi.object({
    TIMEOUT: joi.number().required(),
    TRELLO_API_KEY: joi.string().required(),
    TRELLO_API_TOKEN: joi.string().required(),
    TRELLO_BOARD_ID: joi.string().required()
}).unknown().required();

const { error, value: env } = environmentSchema.validate(process.env);
if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
}

const environment = {
    timeout: env.TIMEOUT,
    trelloApiKey: env.TRELLO_API_KEY,
    trelloApiToken: env.TRELLO_API_TOKEN,
    trelloBoardId: env.TRELLO_BOARD_ID,
};

module.exports = { ...environment };