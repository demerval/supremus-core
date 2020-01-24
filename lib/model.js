const Models = require('./models');
const GeradorSqlConsulta = require('./geradorSqlConsulta');

class Model {

  constructor(nome, dao) {
    this.model = Models.getModel(nome, dao);
    this.geradorSql = new GeradorSqlConsulta();
  }

  async consultar(config) {
    const configTesteNormal = {
      table: 'usuario',
      fields: 'id, nome, tipo',
      where: "nome like ? and tipo = ? and (nome = ? or nome = ?) and id between ? and ? or id > 0",
      orderBy: 'nome desc, tipo',
      params: ['supo', 'admin', 'a', 'a', 0, 10, 20],
    }

    const configTesteJoin = {
      table: 'usuario u, usuarioPermissao up',
      fields: 'u.id, u.nome, u.tipo, up.permissao',
      joins: 'up.idUsuario = u.id', // {type: 'left', join: 'c.cod_endereco = c.id'}
      where: 'u.id = ?',
      orderBy: 'u.nome asc',
      params: [1],
    }

    await this.geradorSql.getSql(configTesteNormal);
    await this.geradorSql.getSql(configTesteJoin);

    return this.model.consultar(config);
  }

  async consultarPorId(id, fields) {
    return await this.model.consultarPorId(id, fields);
  }

  async consultaPaginada(config) {
    return this.model.consultaPaginada(config);
  }

  async salvar(item, status) {
    await this.model.salvar(item, status);
    return this.model.getItem();
  }

  getItem() {
    return this.model.getItem();
  }

}

module.exports = Model;