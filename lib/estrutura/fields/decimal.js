const Types = require('../../enum/types');
const setDecimalValue = require('./functions/setDecimal');

module.exports = {

  decimal(fieldName, decimal = 2, config) {
    return {
      name: fieldName,
      type: Types.DECIMAL,
      defaultValue: 0,
      decimalPlaces: decimal,
      setValue: setDecimalValue,
      ...config,
    }
  },

  decimalRequired(fieldName, decimal = 2) {
    return {
      name: fieldName,
      type: Types.DECIMAL,
      required: true,
      decimalPlaces: decimal,
      setValue: setDecimalValue
    }
  }

}