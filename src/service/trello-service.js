const environment = require('../configuration/environment');
const { get, post, put } = require('./http-service');

const { trelloApiKey, trelloApiToken, trelloBoardId } = environment;
const baseUrl = 'https://api.trello.com/1';
const credentials = {
    key: trelloApiKey,
    token: trelloApiToken
};

const _getCredentialsUri = () => {
    const { key, token } = credentials;
    return `key=${key}&token=${token}`;
}

const insertList = async (name) => {
    const url = `${baseUrl}/lists`;
    const body = {
        ...credentials,
        idBoard: trelloBoardId,
        name
    };

    return await post({ url, body });
};

const insertCard = async (title, description, listId) => {
    const url = `${baseUrl}/cards`;
    const body = {
        ...credentials,
        idList: listId,
        name: title,
        desc: description,
        pos: 'top'
    };

    return await post({ url, body });
};

const getLists = async () => {
    const url = `${baseUrl}/boards/${trelloBoardId}/lists?${_getCredentialsUri()}`;
    const { data } = await get({ url });
    return data;
};

const getListByName = async (name) => {
    const lists = await getLists();
    return lists.find(list => list.name.toLowerCase() === name);
};

const getAllCardsTitles = async () => {
    const lists = await getLists();
    const listIds = lists.map(list => list.id);

    let promises = [];
    listIds.forEach(listId => {
        const url = `${baseUrl}/lists/${listId}/cards?${_getCredentialsUri()}`;
        promises.push(get({ url }));
    });

    let responses = await Promise.all(promises);
    const cardTitles = responses.map(response => response.data)
        .flat(1)
        .map(card => card.name);
    
    return cardTitles;
};

const arquiveList = async (name) => {
    const list = await getListByName(name);
    const url = `${baseUrl}/lists/${list.id}/closed`;
    const body = {
        ...credentials,
        value: true
    };

    return await put({ url, body });
};

module.exports = { insertList, insertCard, getLists, getListByName, getAllCardsTitles, arquiveList };