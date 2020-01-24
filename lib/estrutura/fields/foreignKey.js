const Types = require('../../enum/types');
const setIntegerValue = require('./functions/setInteger');
const setStringValue = require('./functions/setString');

module.exports = {

  integerRequired(fieldName, tableInfo, alias) {
    return {
      name: fieldName,
      alias: alias,
      tableInfo: tableInfo,
      type: Types.INTEGER,
      required: true,
      foreignKey: true,
      setValue: setIntegerValue
    }
  },

  integer(fieldName, tableInfo, alias, config) {
    return {
      name: fieldName,
      alias: alias,
      tableInfo: tableInfo,
      type: Types.INTEGER,
      foreignKey: true,
      setValue: setIntegerValue,
      ...config,
    }
  },

  stringRequired(fieldName, tableInfo, tamanho = 10, alias) {
    return {
      name: fieldName,
      alias: alias,
      tableInfo: tableInfo,
      type: Types.STRING,
      required: true,
      foreignKey: true,
      maxLength: tamanho,
      setValue: setStringValue
    }
  },

  string(fieldName, tableInfo, tamanho = 10, alias, config) {
    return {
      name: fieldName,
      alias: alias,
      tableInfo: tableInfo,
      type: Types.STRING,
      foreignKey: true,
      maxLength: tamanho,
      setValue: setStringValue,
      ...config,
    }
  }

}