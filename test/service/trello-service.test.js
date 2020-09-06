const { insertCard, insertList, getLists, getListByName, getAllCardsTitles, arquiveList } = require('../../src/service/trello-service');

const testListName = 'test';

let isTestListPresent = false;
let testListId;

describe('trello service', () => {
    beforeEach(async () => {
        if (!isTestListPresent) {
            
            const list = await getListByName(testListName);
            if (!list) {
                const { data } = await insertList(testListName);
                testListId = data.id;
            } else {
                testListId = list.id;
            }

            isTestListPresent = true;
        }
    });

    test('should be able to insert new lists in board', async () => {
        const listName = 'test2';

        const insertResponse = await insertList(listName);
        expect(insertResponse.status).toBe(200);

        const arquiveResponse = await arquiveList(listName);
        expect(arquiveResponse.status).toBe(200);
    });

    test('should be able to insert a card into a list', async () => {
        const insertResult = await insertCard('test', 'this is a test', testListId);
        expect(insertResult.status).toBe(200);
    });

    test('should be able to get all lists in the board', async () => {
        const lists = await getLists();
        expect(lists.length).toBeGreaterThan(0);
    });

    test('should be able to get a list by its name', async () => {
        const list = await getListByName(testListName);
        expect(list.name).toMatch(testListName);
    });

    test('should be able to get all cards in the board', async () => {
        const cards = await getAllCardsTitles();
        expect(cards.length).toBeGreaterThan(0);
    });

    test('should be able to archive a list', async () => {
        let arquiveResponse = await arquiveList(testListName);
        expect(arquiveResponse.status).toBe(200);
    });
});