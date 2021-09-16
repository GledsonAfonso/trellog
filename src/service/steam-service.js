const { get } = require('./http-service');

const baseUrl = 'https://store.steampowered.com';

const searchFor = async (query) => {
    const encodedQuery = encodeURI(query);
    const url = `${baseUrl}/search/?term=${encodedQuery}`;
    return await get({ url });
};

const getAppPage = async (url) => {
    const headers = {
        'content-type': 'application/json',
        'Cookie': 'birthtime=283993201; wants_mature_content=1'
    };

    return await get({ url, headers, withCredentials: true });
};

module.exports = { searchFor, getAppPage };