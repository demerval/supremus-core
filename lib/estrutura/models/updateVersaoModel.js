const Tabela = require('../../tabela');
const Fields = require('../fields');

class Config {

  constructor() {
    this.nome = 'UPDATE_VERSAO';
    this.versao = 1;
    this.campos = this.getCampos();
  }

  getCampos() {
    let campos = new Map();

    campos.set('id', Fields.id.idInteger('id'));
    campos.set('idUpdate', Fields.integer.integer('id_update'));

    return campos;
  }

}

class UpdateVersaoModel extends Tabela {

  constructor() {
    super(new Config());
  }

}

module.exports = UpdateVersaoModel;