const environment = require('../configuration/environment');
const { get, post, put } = require('./http-service');

const { trello_api_key, trello_api_token, trello_board_id } = environment;
const base_url = 'https://api.trello.com/1';
const credentials = {
    key: trello_api_key,
    token: trello_api_token
};

const _getCredentialsUri = () => {
    const { key, token } = credentials;
    return `key=${key}&token=${token}`;
}

const insertList = async (name) => {
    const url = `${base_url}/lists`;
    const body = {
        ...credentials,
        idBoard: trello_board_id,
        name
    };

    return await post({ url, body });
};

const insertCard = async (title, description, list_id) => {
    const url = `${base_url}/cards`;
    const body = {
        ...credentials,
        idList: list_id,
        name: title,
        desc: description,
        pos: 'top'
    };

    return await post({ url, body });
};

const getLists = async () => {
    const url = `${base_url}/boards/${trello_board_id}/lists?${_getCredentialsUri()}`;
    const { data } = await get({ url });
    return data;
};

const getListByName = async (name) => {
    const lists = await getLists();
    return lists.find(list => list.name.toLowerCase() === name);
};

const getAllCardsTitles = async () => {
    const lists = await getLists();
    const list_ids = lists.map(list => list.id);

    let promises = [];
    list_ids.forEach(list_id => {
        const url = `${base_url}/lists/${list_id}/cards?${_getCredentialsUri()}`;
        promises.push(get({ url }));
    });

    let responses = await Promise.all(promises);
    const card_titles = responses.map(response => response.data)
        .flat(1)
        .map(card => card.name);
    
    return card_titles;
};

const arquiveList = async (name) => {
    const list = await getListByName(name);
    const url = `${base_url}/lists/${list.id}/closed`;
    const body = {
        ...credentials,
        value: true
    };

    return await put({ url, body });
};

module.exports = { insertList, insertCard, getLists, getListByName, getAllCardsTitles, arquiveList };