const {
    insertCard,
    insertList,
    getLabels,
    getLists,
    getListByName,
    getCards,
    getCardBy,
    updateCard,
    archiveList,
    deleteCardBy
} = require('../../src/service/trello-service');

const { listForTest, secondListForTest, setup, teardown } = require('../setup-utils');

const generalTestCardName = 'test';
const generalTestCardDescription = 'this is a test';

describe('trello service', () => {
    beforeAll(async () => {
        await setup();
    });

    afterAll(async () => {
        await teardown();
    });

    test('should be able to insert and archive a new list in board', async () => {
        const listName = 'some list for test';

        const insertingList = await insertList(listName);
        expect(insertingList.status).toBe(200);
        
        const archivingList = await archiveList(listName);
        expect(archivingList.status).toBe(200);
    });

    test('should be able to insert a card into a list', async () => {
        const { status } = await insertCard(generalTestCardName, generalTestCardDescription, listForTest.id);
        expect(status).toBe(200);
    });

    test('should be able to get all labels in the board', async () => {
        const { length } = await getLabels();
        expect(length).toBeGreaterThan(0);
    });

    test('should be able to get only labels with titles', async () => {
        const labels = await getLabels();
        const labelsWithNames = labels.filter(it => Boolean(it.name));

        expect(labels.length).toBe(labelsWithNames.length);
    });

    test('should be able to get all lists in the board', async () => {
        const { length } = await getLists();
        expect(length).toBeGreaterThan(0);
    });

    test('should be able to get a list by its name', async () => {
        const { name } = await getListByName(listForTest.name);
        expect(name).toMatch(listForTest.name);
    });

    test('should be able to get all cards in the board', async () => {
        const { length } = await getCards();
        expect(length).toBeGreaterThan(0);
    });

    test('should be able to get a card by its title', async () => {
        const { name, desc } = await getCardBy(generalTestCardName, listForTest.name);

        expect(name).toMatch(generalTestCardName);
        expect(desc).toMatch(generalTestCardDescription);
    });

    test('should be able to update a card by its name and list name', async () => {
        const newDescription = 'blablabla';
        const { name, desc } = await updateCard({ cardName: generalTestCardName, listName: listForTest.name, updates: { description: newDescription } });

        expect(name).toBe(generalTestCardName);
        expect(desc).toBe(newDescription);
    });

    test('should be able to update a card putting it in another list', async () => {
        const { name, idList } = await updateCard({ cardName: generalTestCardName, listName: listForTest.name, updates: { listName: secondListForTest.name } });

        expect(name).toBe(generalTestCardName);
        expect(idList).toBe(secondListForTest.id);
    });

    test('should be able to delete a card by its name', async () => {
        const { status } = await deleteCardBy(generalTestCardName, secondListForTest.name);
        expect(status).toBe(200);
    });
});