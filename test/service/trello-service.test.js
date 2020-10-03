const { insertCard, insertList, getLists, getListByName, getCards, getCardBy, updateCard, arquiveList, deleteCardBy } = require('../../src/service/trello-service');

const generalTestListName = 'test';
const updateTestListName = 'new test list';
const generalTestCardName = 'test';
const generalTestCardDescription = 'this is a test';

let generalTestListId;
let updateTestListId;

describe('trello service', () => {
    test('should be able to insert a new list in board', async () => {
        const insertGeneralTestListResponse = await insertList(generalTestListName);
        const insertUpdateTestListResponse = await insertList(updateTestListName);
        
        expect(insertGeneralTestListResponse.status).toBe(200);
        expect(insertUpdateTestListResponse.status).toBe(200);
        
        generalTestListId = insertGeneralTestListResponse.data.id;
        updateTestListId = insertUpdateTestListResponse.data.id;
    });

    test('should be able to insert a card into a list', async () => {
        const { status } = await insertCard(generalTestCardName, generalTestCardDescription, generalTestListId);
        expect(status).toBe(200);
    });

    test('should be able to get all lists in the board', async () => {
        const { length } = await getLists();
        expect(length).toBeGreaterThan(0);
    });

    test('should be able to get a list by its name', async () => {
        const { name } = await getListByName(generalTestListName);
        expect(name).toMatch(generalTestListName);
    });

    test('should be able to get all cards in the board', async () => {
        const { length } = await getCards();
        expect(length).toBeGreaterThan(0);
    });

    test('should be able to get a card by its title', async () => {
        const { name, desc } = await getCardBy(generalTestCardName, generalTestListName);

        expect(name).toMatch(generalTestCardName);
        expect(desc).toMatch(generalTestCardDescription);
    });

    test('should be able to update a card by its name and list name', async () => {
        const newDescription = 'blablabla';
        const { name, desc } = await updateCard(generalTestCardName, generalTestListName, { description: newDescription });

        expect(name).toBe(generalTestCardName);
        expect(desc).toBe(newDescription);
    });

    test('should be able to update a card putting it in another list', async () => {
        const { name, idList } = await updateCard(generalTestCardName, generalTestListName, { listName: updateTestListName });

        expect(name).toBe(generalTestCardName);
        expect(idList).toBe(updateTestListId);
    });

    test('should be able to delete a card by its name', async () => {
        const { status } = await deleteCardBy(generalTestCardName, updateTestListName);
        expect(status).toBe(200);
    });

    test('should be able to archive a list', async () => {
        let arquiveGeneralTestListResponse = await arquiveList(generalTestListName);
        let arquiveUpdateTestListResponse = await arquiveList(updateTestListName);
        
        expect(arquiveGeneralTestListResponse.status).toBe(200);
        expect(arquiveUpdateTestListResponse.status).toBe(200);
    });
});