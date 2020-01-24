const { Model } = require('../../index');

module.exports = {

  async consultaPaginada(nomeModel, config, dao) {
    return await new Model(nomeModel, dao).consultaPaginada(config);
  },

  async consultar(nomeModel, config, dao) {
    return await new Model(nomeModel, dao).consultar(config);
  },

  async salvar(nomeModel, item, status, dao) {
    return await new Model(nomeModel, dao).salvar(item, status);
  },

  async excluir(nomeModel, id, fields, dao) {
    const model = new Model(nomeModel, dao);
    const item = await model.consultarPorId(id, fields);
    if (item === undefined) {
      throw new Error('Registro não localizado.');
    }

    await model.salvar(item, 'delete');

    return item;
  },

}