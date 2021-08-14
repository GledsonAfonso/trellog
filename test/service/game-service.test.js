const { getCachedLists } = require('../../src/service/board-service');
const { getGameInfo, createGameCardFor, deleteGameCardBy } = require('../../src/service/game-service');
const { archiveList } = require('../../src/service/trello-service');

const { setup, teardown } = require('../setup-utils');

describe('game service', () => {
    beforeAll(async () => {
        await setup();
    });

    afterAll(async () => {
        await teardown();
    });

    describe('general cases', () => {
        test('should be able to get game info', async () => {
            const gameInfo = await getGameInfo('Super Mario Bros. 3');
    
            const expectedResult = {
                title: 'Super Mario Bros. 3',
                developer: 'Nintendo R&D4',
                publisher: 'Nintendo'
            };
    
            expect(gameInfo).toEqual(expectedResult);
        });
    
        test('should be able to get game info even when it has many related developers and publishers in its infobox', async () => {
            const gameInfo = await getGameInfo('Corpse Party');
    
            const expectedResult = {
                title: 'Corpse Party',
                developer: 'Team GrisGris (1996–present); 5pb. (2010–present); Mages. (2011–2012); GrindHouse (2013–present)',
                publisher: 'Kenix Soft (1996); Team GrisGris (2006); 5pb (2010–present); Marvelous USA (2011–present); GrindHouse (2013–present)'
            };
    
            expect(gameInfo).toEqual(expectedResult);
        });
    
        test('should be able to get a game info on Steam when there\'s no info about it on Wikipedia', async () => {
            const gameInfo = await getGameInfo('Radio the Universe');
    
            const expectedResult = {
                title: 'Radio the Universe',
                developer: '6E6E6E',
                publisher: '6E6E6E'
            };
    
            expect(gameInfo).toEqual(expectedResult);
        });
    
        test('should be able to get a game info on Steam when there\'s more than one developer and/or publisher', async () => {
            const gameInfo = await getGameInfo('BioShock 2 Remastered');
    
            const expectedResult = {
                title: 'BioShock 2 Remastered',
                developer: '2K Marin; 2K China; Digital Extremes; 2K Australia; Blind Squirrel; Feral Interactive (Mac)',
                publisher: '2K; Feral Interactive (Mac)'
            };
    
            expect(gameInfo).toEqual(expectedResult);
        });
    
        test('should give a blank object when no information is found', async () => {
            const gameInfo = await getGameInfo('asfdjhjaksjldhflkjahjdlfh');
    
            expect(gameInfo).toBeUndefined();
        });
    
        test(`should be able to create a card with all the game's info, given its name`, async () => {
            const { status } = await createGameCardFor({ name: 'Corpse Party', listName: 'test' });
            expect(status).toBe(200);
        });
    
        test(`should be able to create a card with a default template when no info is found about the game, given its name`, async () => {
            const { status, data } = await createGameCardFor({ name: 'asdfasdfasdf', listName: 'test' });
            const expectedData = { name: 'asdfasdfasdf' };
    
            expect(status).toBe(200);
            expect(data).toMatchObject(expectedData);
        });
    
        test('should delete a game card by its name', async () => {
            const firstCardDeletion = await deleteGameCardBy({ name: 'Corpse Party', listName: 'test' });
            const secondCardDeletion = await deleteGameCardBy({ name: 'asdfasdfasdf', listName: 'test' });
    
            expect(firstCardDeletion.status).toBe(200);
            expect(secondCardDeletion.status).toBe(200);
        });
    
        test('should be able to create a card without labels and in a list that doesn\'t exist, creating it in the process', async () => {
            const name = 'some card name';
            const listName = 'test2';
    
            const { status, data } = await createGameCardFor({ name, listName });
            const lists = await getCachedLists();
            const listId = lists.filter(list => list.name === listName)[0].id;
    
            const expectedData = { name, idList: listId };
    
            expect(status).toBe(200);
            expect(data).toMatchObject(expectedData);
    
            const { status: archiveStatus } = await archiveList(listName);
            expect(archiveStatus).toBe(200);
        }); 
    });

    describe('specific cases', () => {
        test('should be able to add The Ascent without removing the "The" part, and include its info', async () => {
            const gameInfo = await getGameInfo('The Ascent');
    
            const expectedResult = {
                title: 'The Ascent',
                developer: 'Neon Giant',
                publisher: 'Curve Digital'
            };
    
            expect(gameInfo).toEqual(expectedResult);
        });
    });
});