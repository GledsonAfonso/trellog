const { insertList, archiveList } = require('../src/service/trello-service');

const listNameForTest = 'test';
const secondListNameForTest = 'new test list';

let listForTest = {
    id: '',
    name: listNameForTest
};

let secondListForTest = {
    id: '',
    name: secondListNameForTest
};

const setup = async () => {
    const listNameForTestResponse = await insertList(listNameForTest);
    const secondListNameForTestResponse = await insertList(secondListNameForTest);

    listForTest.id = listNameForTestResponse?.data?.id;
    secondListForTest.id = secondListNameForTestResponse?.data?.id;
};

const teardown = async () => {
    await archiveList(listNameForTest);
    await archiveList(secondListNameForTest);
};

module.exports = { listForTest, secondListForTest, setup, teardown };