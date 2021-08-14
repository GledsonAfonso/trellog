const cheerio = require('cheerio');

const { insertCard, insertList, deleteCardBy } = require('./trello-service');
const { addToCachedList, getCachedLists, getCachedLabels } = require('./board-service');
const wikipediaService = require('./wikipedia-service');
const steamService = require('./steam-service');

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

const _getGameInfoOnWikipedia = async (gameName) => {
    let result;

    let { data: page } = await wikipediaService.searchFor(gameName);
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

const _isSameGame = (insertedTitle, scrapedTitle) => {
    const sanitizedInsertedTitle = insertedTitle.replace(/[:-]/, '');
    const sanitizedScrapedTitle = scrapedTitle.replace(/[:-]/, '');

    return sanitizedScrapedTitle.toLowerCase().includes(sanitizedInsertedTitle.toLowerCase());
};

const _collectSummaryTexts = ($, element) => {
    let result = $(element).find('div.summary > a')
        .toArray()
        .map(element => $(element).text())
        .join('; ');
    
    return result;
};

const _getTextWithoutTrademarkSymbols = (text) => {
    const result = text.replace(/[™®©℠]/, '');
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
        
            let developer = '';
            let publisher = '';
            gameInfoElement.toArray().forEach(element => {
                const isDeveloperInfo = $(element).find('div.subtitle:contains("Developer")').html() !== null;
                const isPublisherInfo = $(element).find('div.subtitle:contains("Publisher")').html() !== null;
        
                if (isDeveloperInfo) {
                    developer = _collectSummaryTexts($, element);
                } else if (isPublisherInfo) {
                    publisher = _collectSummaryTexts($, element);
                }
            });
            
            if (developer?.length > 0 && publisher?.length > 0) {
                result = {
                    title,
                    developer,
                    publisher
                };
            }
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