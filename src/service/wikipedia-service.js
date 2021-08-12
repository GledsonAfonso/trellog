const { get } = require('./http-service');

const baseUrl = 'https://en.wikipedia.org/api/rest_v1';

const searchFor = async (query) => {
    const url = `${baseUrl}/page/html/${query}`;
    return await get({ url });
};

module.exports = { searchFor };