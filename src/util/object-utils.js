const isBlank = (object) => object && object !== null ? Object.keys(object).length === 0 : true;

module.exports = { isBlank };