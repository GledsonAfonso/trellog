const cheerio = require('cheerio');

const { get } = require('./http-service');

const base_url = 'https://en.wikipedia.org/api/rest_v1';

const searchFor = async (query) => {
    const url = `${base_url}/page/html/${query}`;
    return await get({ url });
};

const getInfoboxFrom = async (query) => {
    let { data: page } = await searchFor(query);
    let $ = cheerio.load(page);
    
    return $('body > section > table.infobox.hproduct').html();
};

module.exports = { searchFor, getInfoboxFrom };