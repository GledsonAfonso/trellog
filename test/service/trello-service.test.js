const { insertCard, insertList, getLists, getListByName, getAllCardsTitles, arquiveList } = require('../../src/service/trello-service');

const test_list_name = 'test';

let is_test_list_present = false;
let test_list_id;

describe('trello service', () => {
    beforeEach(async () => {
        if (!is_test_list_present) {
            
            const list = await getListByName(test_list_name);
            if (!list) {
                const { data } = await insertList(test_list_name);
                test_list_id = data.id;
            } else {
                test_list_id = list.id;
            }

            is_test_list_present = true;
        }
    });

    test('should be able to insert new lists in board', async () => {
        const list_name = 'test2';

        const insert_response = await insertList(list_name);
        expect(insert_response.status).toBe(200);

        const arquive_response = await arquiveList(list_name);
        expect(arquive_response.status).toBe(200);
    });

    test('should be able to insert a card into a list', async () => {
        const insert_result = await insertCard('test', 'this is a test', test_list_id);
        expect(insert_result.status).toBe(200);
    });

    test('should be able to get all lists in the board', async () => {
        const lists = await getLists();
        expect(lists.length).toBeGreaterThan(0);
    });

    test('should be able to get a list by its name', async () => {
        const list = await getListByName(test_list_name);
        expect(list.name).toMatch(test_list_name);
    });

    test('should be able to get all cards in the board', async () => {
        const cards = await getAllCardsTitles();
        expect(cards.length).toBeGreaterThan(0);
    });

    test('should be able to archive a list', async () => {
        let arquive_response = await arquiveList(test_list_name);
        expect(arquive_response.status).toBe(200);
    });
});