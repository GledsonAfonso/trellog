const cheerio = require('cheerio');

const { insertList, insertCard, getListByName } = require('./trello-service');
const { searchFor } = require('./wikipedia-service');
const { isBlank } = require('../util/object-utils');

const _getListIdBy = async (listName) => {
    let result;
    
    const list = await getListByName(listName);

    if (!list) {
        const { data } = await insertList(listName);
        result = data.id;
    } else {
        result = list.id;
    }

    return result;
};

const _getSanitizedText = (infoText) => {
    const prefixRegex = /^\n/;
    const suffixRegex = /\n\n$/;
    const generalRegex = /\n/g;

    let sanitizedInfoText = infoText.replace(prefixRegex, '');
    sanitizedInfoText = sanitizedInfoText.replace(suffixRegex, '');
    sanitizedInfoText = sanitizedInfoText.replace(generalRegex, '; ');

    return sanitizedInfoText;
};

const getGameInfo = async (gameName) => {
    let result;

    let { data: page } = await searchFor(gameName);
    let $ = cheerio.load(page);

    const title = $('head > title').text();
    const gameInfoLet = $('body > section > table.infobox.hproduct > tbody > tr')
        .map((_, element) => {
            const isDeveloperInfo = $(element).find('th > a:contains("Developer")').html() !== null;
            const isPublisherInfo = $(element).find('th > a:contains("Publisher")').html() !== null;

            let result;
            if (isDeveloperInfo) {
                result = {
                    key: 'developer',
                    value: $(element).find('td').text()
                };
            } else if (isPublisherInfo) {
                result = {
                    key: 'publisher',
                    value: $(element).find('td').text()
                };
            }
    
            return result;
        }).get()
        .reduce((obj, item) => (obj[item.key] = _getSanitizedText(item.value), obj), {});
    
    if (title.length > 0 && gameInfoLet) {
        result = {
            title,
            ...gameInfoLet
        };
    }

    return result;
};

const createGameCardFor = async (gameName) => {
    const listName = 'Temp';
    
    let title;
    let description;

    const gameInfo = await getGameInfo(gameName);

    if (!isBlank(gameInfo)) {
        title = gameInfo.title;
        description = `Developer(s): ${gameInfo.developer}\n\nPublisher(s): ${gameInfo.publisher}`;
    } else {
        title = gameName;
        description = 'Developer(s): \n\nPublisher(s): ';
    }

    const listId = await _getListIdBy(listName);
    return await insertCard(title, description, listId);
};

module.exports = { getGameInfo, createGameCardFor };