const Types = require('../../enum/types');
const setDefault = require('./functions/setDefault');

module.exports = {

  boolean(fieldName, alias, config) {
    return {
      name: fieldName,
      alias: alias,
      type: Types.BOOLEAN,
      defaultValue: false,
      setValue: setDefault,
      ...config,
    }
  }

}