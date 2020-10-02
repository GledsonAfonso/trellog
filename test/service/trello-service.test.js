const { insertCard, insertList, getLists, getListByName, getCards, getCardBy, arquiveList, deleteCardBy } = require('../../src/service/trello-service');

const testListName = 'test';
const testCardName = 'test';
const testCardDescription = 'this is a test';

let testListId;

describe('trello service', () => {
    test('should be able to insert a new list in board', async () => {
        const { status, data } = await insertList(testListName);
        expect(status).toBe(200);

        testListId = data.id;
    });

    test('should be able to insert a card into a list', async () => {
        const { status } = await insertCard(testCardName, testCardDescription, testListId);
        expect(status).toBe(200);
    });

    test('should be able to get all lists in the board', async () => {
        const { length } = await getLists();
        expect(length).toBeGreaterThan(0);
    });

    test('should be able to get a list by its name', async () => {
        const { name } = await getListByName(testListName);
        expect(name).toMatch(testListName);
    });

    test('should be able to get all cards in the board', async () => {
        const { length } = await getCards();
        expect(length).toBeGreaterThan(0);
    });

    test('should be able to get a card by its title', async () => {
        const { name, desc } = await getCardBy(testCardName, testListName);

        expect(name).toMatch(testCardName);
        expect(desc).toMatch(testCardDescription);
    });

    test('should be able to delete a card by its name', async () => {
        const { status } = await deleteCardBy(testCardName, testListName);
        expect(status).toBe(200);
    });

    test('should be able to archive a list', async () => {
        let { status } = await arquiveList(testListName);
        expect(status).toBe(200);
    });
});