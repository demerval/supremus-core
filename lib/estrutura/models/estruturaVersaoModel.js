const Tabela = require('../../tabela');

class Config {

  constructor() {
    this.nome = 'ESTRUTURA_VERSAO';
    this.versao = 1;
    this.campos = this.getCampos();
  }

  getCampos() {
    let campos = new Map();

    campos.set('id', require('../fields/id').idString('tabela', 40));
    campos.set('versao', require('../fields/integer').integerRequired('versao'));

    return campos;
  }

}

class EstruturaVersaoModel extends Tabela {

  constructor() {
    super(new Config());
  }

}

module.exports = EstruturaVersaoModel;