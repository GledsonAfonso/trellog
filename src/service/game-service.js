const cheerio = require('cheerio');

const { searchFor } = require('./wikipedia-service');

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
    let { data: page } = await searchFor(gameName);
    let $ = cheerio.load(page);

    // verificar como ele se comporta quando o infobox tem mais de um desenvolvedor e/ou publisher
    // verificar como ele se comporta quando o jogo não é encontrado
    return $('body > section > table.infobox.hproduct > tbody > tr')
        .map((index, element) => {
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
};

const createGameCardFor = async (gameName) => {};

module.exports = { getGameInfo, createGameCardFor };