const { isBlank, removeEmptyPropertiesFrom } = require('../../src/util/object-utils')

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

    test('should be able to remove empty properties from a given object', () => {
        let object = {
            a: undefined,
            b: null,
            c: '',
            d: 0,
            e: {},
            f: 'this should not be deleted',
            g: {
                h: undefined,
                i: null,
                j: '',
                k: 0,
                l: {},
                m: 'this too should not be deleted'
            },
            n: {
                o: undefined,
                p: null,
                q: '',
                r: 0,
                s: {}
            },
            t: 123
        };

        const expectedObject = {
            f: 'this should not be deleted',
            g: {
                m: 'this too should not be deleted'
            },
            t: 123
        };

        removeEmptyPropertiesFrom(object);

        expect(object).toEqual(expectedObject);
    });
});