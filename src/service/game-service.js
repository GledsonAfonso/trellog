const cheerio = require('cheerio');

const { insertCard, deleteCardBy } = require('./trello-service');
const { searchFor } = require('./wikipedia-service');
const { isBlank } = require('../util/object-utils');
const { getCachedLabels, getCachedLists } = require('./board-service');

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

const createGameCardFor = async ({ name, listName, labelNames = [] }) => {
    let title;
    let description;

    const gameInfo = await getGameInfo(name);

    if (!isBlank(gameInfo)) {
        title = gameInfo.title;
        description = `Developer(s): ${gameInfo.developer}\n\nPublisher(s): ${gameInfo.publisher}`;
    } else {
        title = name;
        description = 'Developer(s): \n\nPublisher(s): ';
    }

    const lists = await getCachedLists();
    const list = lists.find(list => list.name.toLowerCase() === listName.toLowerCase());
    const listId = list?.id;

    const filterLabelsWithUserChoicesFn = label => labelNames
        .map(it => it.toLowerCase())
        .includes(label.name.toLowerCase());
    const labels = await getCachedLabels();
    const sanitizedLabels = labels.filter(filterLabelsWithUserChoicesFn);
    const labelIds = sanitizedLabels?.map(label => label.id);

    return await insertCard(title, description, listId, labelIds);
};

const deleteGameCardBy = async ({ name, listName = 'Temp' }) => await deleteCardBy(name, listName);

module.exports = { getGameInfo, createGameCardFor, deleteGameCardBy };