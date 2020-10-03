const isBlank = (object) => object && object !== null ? Object.keys(object).length === 0 : true;

const removeEmptyPropertiesFrom = (object) => {
    Object.keys(object).forEach(key => {
        if (!!object[key] && typeof object[key] === 'object') {
            removeEmptyPropertiesFrom(object[key]);
        }

        if (!object[key] || (typeof object[key] === 'object' && isBlank(object[key]))) {
            delete object[key];
        }
    });
};

module.exports = { isBlank, removeEmptyPropertiesFrom };