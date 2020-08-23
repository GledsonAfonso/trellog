const { getGameInfo, createGameCardFor } = require('../../src/service/game-service')

describe('game service', () => {
    test('should be able to get game info', async () => {
        const game_info = await getGameInfo('Super Mario Bros. 3');
        const expected_result = {
            developer: 'Nintendo EAD',
            publisher: 'Nintendo'
        };

        expect(game_info).toMatchObject(expected_result);
    });
});