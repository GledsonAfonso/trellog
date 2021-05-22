const cheerio = require('cheerio');

const { insertCard, insertList, deleteCardBy } = require('./trello-service');
const { searchFor } = require('./wikipedia-service');
const { addToCachedList, getCachedLists, getCachedLabels } = require('./board-service');

const _getSanitizedText = (infoText) => {
    const prefixRegex = /^\n/;
    const suffixRegex = /\n\n$/;
    const generalRegex = /\n/g;

    let sanitizedInfoText = infoText.replace(prefixRegex, '');
    sanitizedInfoText = sanitizedInfoText.replace(suffixRegex, '');
    sanitizedInfoText = sanitizedInfoText.replace(generalRegex, '; ');

    return sanitizedInfoText;
};

const _getDescription = (developer = '', publisher = '') => `Developer(s): ${developer}\n\nPublisher(s): ${publisher}`;

const _getCardContentFrom = (title, gameInfo) => {
    const gameCardContent = {
        title: '',
        description: ''
    };

    gameCardContent.title = (gameInfo?.title) ? gameInfo.title : title;
    gameCardContent.description = _getDescription(gameInfo?.developer, gameInfo?.publisher);

    return gameCardContent;
};

const _getListId = async (listName) => {
    const lists = await getCachedLists();

    let list = lists.find(list => list.name.toLowerCase() === listName.toLowerCase());
    if (!list) {
        const { data } = await insertList(listName);
        list = data;

        addToCachedList(data);
    }

    return list.id;
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

const createGameCardFor = async ({ name, listName = 'Temp', labelNames = [] }) => {
    const gameInfo = await getGameInfo(name);
    const { title, description } = _getCardContentFrom(name, gameInfo);
    const listId = await _getListId(listName);

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