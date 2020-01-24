'use strict';

const fs = require('fs');
const path = require('path');
const DAO = require('../DAO');
const UpdateVersaoModel = require('./models/updateVersaoModel');

const dao = new DAO();
const model = new UpdateVersaoModel();

module.exports = {

  async verificarUpdate(id, dirUpdates) {
    await dao.openConexao(false);

    let at = await model.consultarPorId(id);
    if (at === undefined) {
      at = {
        id: id,
        idUpdate: 0
      };
      await model.salvar(at, UpdateVersaoModel.Status.INSERT);
      at = model.getItem();
    }

    let files = fs.readdirSync(__basedir + '/' + dirUpdates);

    for (let it in files) {
      let file = files[it];
      if (file.indexOf('.js') > -1) {
        let fileName = path.basename(file, '.js');
        let Update = require(__basedir + '/' + dirUpdates + '/' + fileName);
        await executarUpdate(at, new Update());
      }
    }

    dao.closeConexao();

    return true;
  }

}

async function executarUpdate(at, update) {
  await update.execute(at, dao);

  if (update.salvarId()) {
    at.idUpdate = update.getIdUpdate();
    await model.salvar(at, UpdateVersaoModel.Status.UPDATE);
  }

  return true;
}