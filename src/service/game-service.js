const cheerio = require('cheerio');

const { insertCard, insertList, deleteCardBy } = require('./trello-service');
const { addToCachedList, getCachedLists, getCachedLabels } = require('./board-service');
const wikipediaService = require('./wikipedia-service');
const steamService = require('./steam-service');

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

const _isNotInvalidSymbol = (text) => !/^(\s*|:|\(.*\)|JP|WW|EU|NA|PAL|\[lower-alpha.*\]|\/)$/gi.test(text);

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
    let result = $(element).find('td *').contents()
        .map((_, innerElement) => (innerElement.type === 'text') ? $(innerElement).text().trim() : '')
        .get()
        .filter(_isNotInvalidSymbol)
        .map(_sanitizeText)
        .join('; ');
    
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

const _getGameInfo = (
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

    const title = $('head > title').text();

    const gameInfoElement = $('body > section > table.infobox.hproduct > tbody > tr');
    result = _getGameInfo(
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

            result = _getGameInfo(
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

const getGameInfo = async (gameName) => {
    let result = await _getGameInfoOnWikipedia(gameName);
    
    if (!result?.title || !result?.developer || !result?.publisher) {
        result = await _getGameInfoOnSteam(gameName);
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