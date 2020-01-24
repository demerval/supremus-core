const Types = require('../../enum/types');
const setStringValue = require('./functions/setString');

module.exports = {

    phone(fieldName = 'tel', alias, config) {
        return {
            name: fieldName,
            alias: alias,
            type: Types.STRING,
            maxLength: 14,
            setValue: setStringValue,
            ...config,
        }
    },

    phoneRequired(fieldName = 'tel', alias) {
        return {
            name: fieldName,
            alias: alias,
            type: Types.STRING,
            maxLength: 14,
            required: true,
            setValue: setStringValue
        }
    }

}