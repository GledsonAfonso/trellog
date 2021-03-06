const { getLabels, getLists } = require('./trello-service');

let lists = [];
let labels = [];

const addToCachedList = (list) => {
    lists.push(list);
};

const getCachedLists = async () => {
    if (lists.length === 0) {
        lists = await getLists();
    }
    
    return lists;
};

const getCachedLabels = async () => {
    if (labels.length === 0) {
        labels = await getLabels();
    }

    return labels;
};

module.exports = { addToCachedList, getCachedLists, getCachedLabels };