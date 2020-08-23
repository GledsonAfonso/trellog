const cheerio = require('cheerio');

const { get } = require('./http-service');

const base_url = 'https://en.wikipedia.org/api/rest_v1';

const searchFor = async (query) => {
    const url = `${base_url}/page/html/${query}`;
    return await get({ url });
};

module.exports = { searchFor };