const cheerio = require('cheerio');
const asyncPool = require('tiny-async-pool');

const { insertCard, insertList, getCards, updateCard, deleteCardBy } = require('./trello-service');
const { addToCachedList, getCachedLists, getCachedLabels } = require('./board-service');
const wikipediaService = require('./wikipedia-service');
const steamService = require('./steam-service');
const { writeGameNamesInFile } = require('./file-service');

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

const _isNotInvalidSymbol = (text) => {
    const isNotInvalidSymbol = !/^(\s*|:|\(.*\)|JP|WW|EU|NA|PAL|\[lower-alpha.*\]|\[[0-9]+\]|\/)$/gi.test(text);
    const isNotDatePeriod = !/\d+\–\d+/gi.test(text);

    return isNotInvalidSymbol && isNotDatePeriod;
}

const _isNotConsoleName = (text) => !/(playstation|microsoft\s+windows|xbox)/gi.test(text);

const _sanitizeText = (text) => {
    let result = text.replace(/\(.*\)/g, '');
    result = result.trim();

    return result;
};

const _getTextWithoutTrademarkSymbols = (text) => {
    const result = text.replace(/[™®©℠]/, '');
    return result;
};

const _isSameGame = (insertedTitle, scrapedTitle) => {
    const sanitizedInsertedTitle = insertedTitle.replace(/[:-]/, '');
    const sanitizedScrapedTitle = scrapedTitle.replace(/[:-]/, '');

    return sanitizedScrapedTitle.toLowerCase() === sanitizedInsertedTitle.toLowerCase();
};

const _getValuesFromWikipediaElement = ($, element) => {
    let info = $(element).find('td *').contents()
        .map((_, innerElement) => (innerElement.type === 'text') ? $(innerElement).text().trim() : '')
        .get()
        .filter(_isNotInvalidSymbol)
        .filter(_isNotConsoleName)
        .map(_sanitizeText);

    info = Array.from(new Set(info));
    
    let result = info.join('; ');
    
    if (result.length === 0) {
        result = $(element).find('td')
            .text()
            .trim();
    }

    return result;
};

const _getValuesFromSteamElement = ($, element) => {
    let result = $(element).find('div.summary > a')
        .toArray()
        .map(element => $(element).text())
        .join('; ');
    
    return result;
};

const _getGameInfoFromWebPage = (
    title,
    $,
    gameInfoElement,
    developerElementVerificationPath,
    publisherElementVerificationPath,
    getElementValueFn
) => {
    let result;
    let developer = '';
    let publisher = '';

    gameInfoElement.toArray().forEach(element => {
        const isDeveloperInfo = $(element).find(developerElementVerificationPath).html() !== null;
        const isPublisherInfo = $(element).find(publisherElementVerificationPath).html() !== null;

        if (isDeveloperInfo) {
            developer = getElementValueFn($, element);
        } else if (isPublisherInfo) {
            publisher = getElementValueFn($, element);
        }
    });
    
    if (developer?.length > 0 && publisher?.length > 0) {
        result = {
            title,
            developer,
            publisher
        };
    }

    return result;
};

const _getGameInfoOnWikipedia = async (gameName) => {
    let result;

    let { data: page } = await wikipediaService.searchFor(gameName);
    let $ = cheerio.load(page);

    const title = $('head > title').text().replaceAll(/<(\/?)\w+>/gi, '');

    const gameInfoElement = $('body > section > table.infobox.hproduct > tbody > tr');
    result = _getGameInfoFromWebPage(
        title,
        $,
        gameInfoElement,
        'th > a:contains("Developer")',
        'th > a:contains("Publisher")',
        _getValuesFromWikipediaElement
    );

    return result;
};

const _getGameInfoOnSteam = async (gameName) => {
    let result;

    const { data: searchPage } = await steamService.searchFor(gameName);
    let $ = cheerio.load(searchPage);

    const searchPageElement = $(`
        body
         > div.responsive_page_frame.with_header
         > div.responsive_page_content
         > div.responsive_page_template_content
         > form#advsearchform
         > div.page_content_ctn
         > div.page_content
         > div.leftcol.large
         > div#search_results.search_results
         > div#search_result_container
         > div#search_resultsRows
         > a
    `);
    const gameLink = $(searchPageElement).attr('href');

    if (gameLink) {
        const { data: gamePage } = await steamService.getAppPage(gameLink);
        $ = cheerio.load(gamePage);
    
        const gamePageTitleElement = $(`
            body
             > div.responsive_page_frame.with_header
             > div.responsive_page_content
             > div.responsive_page_template_content
             > div.game_page_background.game
             > div#tabletGrid.tablet_grid
             > div.page_content_ctn
             > div.page_title_area.game_title_area.page_content
             > div.apphub_HomeHeaderContent
             > div.apphub_HeaderStandardTop
             > div#appHubAppName.apphub_AppName
        `);
        let title = $(gamePageTitleElement).text();
        title = _getTextWithoutTrademarkSymbols(title);
    
        if (_isSameGame(gameName, title)) {
            const gameInfoElement = $(`
                body
                 > div.responsive_page_frame.with_header
                 > div.responsive_page_content
                 > div.responsive_page_template_content
                 > div.game_page_background.game
                 > div#tabletGrid.tablet_grid
                 > div.page_content_ctn
                 > div.block
                 > div.game_background_glow
                 > div#game_highlights.block_content.page_content
                 > div.rightcol
                 > div.glance_ctn
                 > div.glance_ctn_responsive_left
                 > div.dev_row
            `);

            result = _getGameInfoFromWebPage(
                title,
                $,
                gameInfoElement,
                'div.subtitle:contains("Developer")',
                'div.subtitle:contains("Publisher")',
                _getValuesFromSteamElement
            );
        }
    }

    return result;
};

const _isInvalidGameInfo = (gameInfo) => !gameInfo?.title || !gameInfo?.developer || !gameInfo?.publisher;

const _getGameInfo = async (gameName, isFirstTry = true) => {
    let result = await _getGameInfoOnWikipedia(gameName);
    
    if (_isInvalidGameInfo(result)) {
        result = await _getGameInfoOnSteam(gameName);
    }

    if (_isInvalidGameInfo(result) && isFirstTry) {
        const gameNameInTitleCase = gameName.replaceAll(/(\w)(\w*)/g, (_, firstLetter, restOfString) => firstLetter.toUpperCase() + restOfString.toLowerCase());
        result = await _getGameInfo(gameNameInTitleCase, false);
    }

    return result;
};

const _getUpdateCardParameters = async (card) => {
    const gameName = card.name;
    const info = await _getGameInfo(gameName);

    if (info?.title) {
        const description = _getDescription(info.developer, info.publisher);
        return { originalCard: card, updates: { description }};
    } else {
        return undefined;
    }
};

const getGameInfo = (gameName) => _getGameInfo(gameName);

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

const updateGameCardsWithoutDescription = async () => {
    let cards = await getCards();
    const cardsWithoutDescription = cards.filter(card => !card.desc);

    console.log('Games without description before procedure: ', cardsWithoutDescription.length);

    for await (const updateCardParameters of asyncPool(10, cardsWithoutDescription, _getUpdateCardParameters)) {
        if (updateCardParameters) {
            await updateCard(updateCardParameters);
        }
    }

    cards = await getCards();
    const names = cards.filter(card => !card.desc).map(card => card.name);

    writeGameNamesInFile(names);
};

const deleteGameCardBy = async ({ name, listName = 'Temp' }) => await deleteCardBy(name, listName);

module.exports = { getGameInfo, createGameCardFor, updateGameCardsWithoutDescription, deleteGameCardBy };