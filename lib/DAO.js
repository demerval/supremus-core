const fbDefault = require('./connectionFactory');

class DAO {

  constructor(fb, configDbKey = 'app') {
    this.fb = fb !== undefined ? fb : fbDefault;
    this.db;
    this.transaction;
    this.configDbKey = configDbKey;
  }

  openConexao(openTransacao) {
    return new Promise((resolve, reject) => {
      this.transaction = undefined;
      this.db = undefined;

      this.fb.open((err, db) => {
        if (err) {
          return reject(err.message);
        }

        this.db = db;
        if (!openTransacao) {
          return resolve();
        }

        this.fb.openTransaction(this.db, (err, transaction) => {
          if (err) {
            return reject(err.message);
          }

          this.transaction = transaction;
          return resolve();
        });
      }, this.configDbKey);
    });
  }

  isConexaoOpen() {
    return (this.db !== undefined);
  }

  isTransacao() {
    return (this.transaction !== undefined);
  }

  executarSql(sql, params) {
    if (this.transaction !== undefined) {
      return new Promise((resolve, reject) => {
        this.transaction.query(sql, params, (err, rows) => {
          if (err) {
            this.transaction.rollback();
            this.closeConexao();
            return reject(err.message);
          }

          return resolve(rows);
        });
      });
    }

    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, rows) => {
        if (err) {
          this.closeConexao();
          return reject(err.message);
        }

        return resolve(rows);
      });
    });
  }

  confirmarTransacao() {
    return new Promise((resolve, reject) => {
      this.transaction.commit(function (err) {
        if (err) {
          return reject(err.message);
        }

        return resolve();
      });
    });
  }

  closeConexao() {
    if (this.db !== undefined) {
      this.db.detach();
    }

    this.transaction = undefined;
    this.db = undefined;
  }

  gerarId(generatorName) {
    return new Promise((resolve, reject) => {
      var sql = `SELECT GEN_ID(${generatorName}, 1) AS GEN FROM RDB$DATABASE`;
      this.db.query(sql, (err, rows) => {
        if (err) {
          return reject(err.message);
        }

        return resolve(rows[0].GEN);
      });
    });
  }

}

module.exports = DAO;