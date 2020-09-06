const { searchFor } = require('../../src/service/wikipedia-service');

describe('wikipedia service', () => {
    test('should be able to search queries', async () => {
        const searchResult = await searchFor('Wikipedia');
        expect(searchResult.status).toBe(200);
    });

    test('should give 404 when no results are found for query', async () => {
        const searchResult = await searchFor('jwheiu9fjh23894ht92h3g8h24g78h45');
        expect(searchResult.status).toBe(404);
    });
});