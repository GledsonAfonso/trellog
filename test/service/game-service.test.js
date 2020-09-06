const { getGameInfo, createGameCardFor } = require('../../src/service/game-service')

describe('game service', () => {
    test('should be able to get game info', async () => {
        const gameInfo = await getGameInfo('Super Mario Bros. 3');

        const expectedResult = {
            developer: 'Nintendo EAD',
            publisher: 'Nintendo'
        };

        expect(gameInfo).toMatchObject(expectedResult);
    });

    test('should be able to get game info even when it has many related developers and publishers in its infobox', async () => {
        const gameInfo = await getGameInfo('Corpse Party');

        const expectedResult = {
            developer: 'Team GrisGris (1996–present); 5pb. (2010–present); Mages. (2011–2012); GrindHouse (2013–present)',
            publisher: 'Kenix Soft (1996); Team GrisGris (2006); 5pb (2010–present); Marvelous USA (2011–present); GrindHouse (2013–present)'
        };

        expect(gameInfo).toMatchObject(expectedResult);
    });

    test('should give a blank object when no information is found', async () => {
        const gameInfo = await getGameInfo('asfdjhjaksjldhflkjahjdlfh');

        const expectedResult = {};

        expect(gameInfo).toMatchObject(expectedResult);
    });
});