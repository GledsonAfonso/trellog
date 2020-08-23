const cheerio = require('cheerio');

const { searchFor } = require('./wikipedia-service');

const _getDescription = (developers, publishers) => `Developer(s): ${developers.join('; ')}\nPublisher(s): ${publishers.join('; ')}`;

const getGameInfo = async (game_name) => {
    let { data: page } = await searchFor(game_name);
    let $ = cheerio.load(page);

    return $('body > section > table.infobox.hproduct > tbody > tr')
        .map((index, element) => {
            const is_developer_info = $(element).find('th > a:contains("Developer")').html() !== null;
            const is_publisher_info = $(element).find('th > a:contains("Publisher")').html() !== null;

            let result;
            if (is_developer_info) {
                result = {
                    key: 'developer',
                    value: $(element).find('td').text()
                };
            } else if (is_publisher_info) {
                result = result = {
                    key: 'publisher',
                    value: $(element).find('td').text()
                };
            }
    
            return result;
        }).get()
        .reduce((obj, item) => (obj[item.key] = item.value, obj), {});
};

const createGameCardFor = async (game_name) => {};

module.exports = { getGameInfo, createGameCardFor };