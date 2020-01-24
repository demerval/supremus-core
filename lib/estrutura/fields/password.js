const Types = require('../../enum/types');
const setValueSenha = require('./functions/setSenha');

module.exports = {

  password(fieldName = 'password', alias, config) {
    return {
      name: fieldName,
      alias: alias,
      type: Types.STRING,
      required: true,
      minLength: 4,
      maxLength: 60,
      noneCase: true,
      noSelect: true,
      setValue: setValueSenha,
      ...config,
    }
  }

}