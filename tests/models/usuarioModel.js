const { Tabela } = require(__basedir + '/index');
const UsuarioSchema = require('../schemas/usuarioSchema');

class UsuarioModel extends Tabela {

  constructor(dao) {
    super(new UsuarioSchema(), dao);
    this.nomeModel = 'usuario';
  }

  async onUpdateDb(versao) {
    console.log(`Atualizando tabela usuarios no db versão: ${versao}`);
  }

  async antesSalvar(item, status) {
    console.log(status);
    console.log(item);

    if (status === 'delete') {
      throw new Error('O usuário não pode ser excluído.');
    }
  }

  async depoisSalvar(item, status) {
    console.log(status);
    console.log(item);
  }

  async onItemCarregado(item) {
    item.teste = 'TESTADO';
  }

}

module.exports = UsuarioModel;