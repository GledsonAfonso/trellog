const { isBlank } = require('../../src/util/object-utils')

describe('object utils', () => {
    test('should be able to verify if object is blank', () => {
        const undefinedObject = undefined;
        const nullObject = null;
        const blankObject = {};
        const validObject = { a: 1 };

        expect(isBlank(undefinedObject)).toBeTruthy();
        expect(isBlank(nullObject)).toBeTruthy();
        expect(isBlank(blankObject)).toBeTruthy();
        expect(isBlank(validObject)).toBeFalsy();
    });
});