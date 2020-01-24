const Types = require('../../enum/types');
const Persist = require('../../enum/persist');

module.exports = {

  integer(fieldName, alias, functionName, config) {
    return {
      name: fieldName,
      alias: alias,
      functionName: functionName,
      type: Types.INTEGER,
      persist: Persist.NUNCA,
      ...config,
    }
  },

  decimal(fieldName, alias, functionName, config) {
    return {
      name: fieldName,
      alias: alias,
      functionName: functionName,
      type: Types.DECIMAL,
      persist: Persist.NUNCA,
      ...config,
    }
  }

}