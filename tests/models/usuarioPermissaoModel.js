const { Tabela } = require(__basedir + '/index');
const UsuarioPermissaoSchema = require('../schemas/usuarioPermissaoSchema');

class UsuarioPermissaoModel extends Tabela {

  constructor(dao) {
    super(new UsuarioPermissaoSchema(), dao);
    this.nomeModel = 'usuarioPermissao';
  }

}

module.exports = UsuarioPermissaoModel;