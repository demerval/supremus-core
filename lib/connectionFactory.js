const firebird = require('node-firebird');
const config = require(__basedir + '/config/dbConfig');

module.exports = {

  open(callback, configKeyDb = 'app') {
    configDb = config[configKeyDb];
    if (configDb === undefined) {
      throw new Error(`Não foi localizada a configuração para o banco de dados key: ${configKeyDb}`);
    }
    return firebird.attach(configDb, callback);
  },

  openTransaction(db, callback) {
    db.transaction(firebird.ISOLATION_READ_COMMITED, function (err, transaction) {
      if (err) {
        callback(true);
        return;
      }

      callback(false, transaction);
    });
  }

};