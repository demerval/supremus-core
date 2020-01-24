const { Tabela } = require(__basedir + '/index');
const ClienteSchema = require('../schemas/clienteSchema');

class ClienteModel extends Tabela {

  constructor(dao) {
    super(new ClienteSchema(), dao);
  }

}

module.exports = ClienteModel;