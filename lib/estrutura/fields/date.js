const Types = require('../../enum/types');
const Persist = require('../../enum/persist');
const setValueDate = require('./functions/setDate');
const setValueDateInteger = require('./functions/setDateInteger');

module.exports = {

    date(fieldName, alias, config) {
        return {
            name: fieldName,
            alias: alias,
            type: Types.DATE,
            setValue: setValueDate,
            ...config,
        }
    },

    dateDefaultValue(fieldName, alias) {
        return {
            name: fieldName,
            alias: alias,
            type: Types.DATE,
            defaultValue: new Date(),
            setValue: setValueDate,
        }
    },

    dateRegister(fieldName = 'data_cadastro', alias) {
        return {
            name: fieldName,
            alias: alias,
            type: Types.DATE,
            defaultValue: new Date(),
            persist: Persist.INCLUSAO,
            setValue: setValueDate
        }
    },

    dateRequired(fieldName, alias) {
        return {
            name: fieldName,
            alias: alias,
            type: Types.DATE,
            required: true,
            setValue: setValueDate
        }
    },

    dateUpdate(fieldName = 'dt_alteracao') {
        return {
            name: fieldName,
            type: Types.BIG_INT,
            defaultValue: new Date().getTime(),
            setValue: setValueDateInteger
        }
    }

}