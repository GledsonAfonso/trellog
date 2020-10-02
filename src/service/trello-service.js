const environment = require('../configuration/environment');
const { get, post, put, del } = require('./http-service');

const { trelloApiKey, trelloApiToken, trelloBoardId } = environment;
const baseUrl = 'https://api.trello.com/1';
const credentials = {
    key: trelloApiKey,
    token: trelloApiToken
};

const _getCredentialsUri = () => {
    const { key, token } = credentials;
    return `key=${key}&token=${token}`;
};

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
    return lists.find(list => list.name.toLowerCase() === name.toLowerCase());
};

const getCards = async () => {
    const lists = await getLists();
    const listIds = lists.map(list => list.id);
    
    let promises = [];
    listIds.forEach(listId => {
        const url = `${baseUrl}/lists/${listId}/cards?${_getCredentialsUri()}`;
        promises.push(get({ url }));
    });
    
    let responses = await Promise.all(promises);

    return responses.map(response => response.data);
};

const getCardBy = async (name, listName) => {
    let result;

    const cards = await getCards();
    const { id: listId } = await getListByName(listName);
    result = cards.flat(1).filter(card => card.name.toLowerCase() === name.toLowerCase() && card.idList === listId);

    if (result) {
        result = result[0];
    }

    return result;
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

const deleteCardBy = async (name, listName) => {
    const { id } = await getCardBy(name, listName);
    const url = `${baseUrl}/cards/${id}?${_getCredentialsUri()}`;

    return del({ url });
};

module.exports = { insertList, insertCard, getLists, getCards, getCardBy, getListByName, arquiveList, deleteCardBy };