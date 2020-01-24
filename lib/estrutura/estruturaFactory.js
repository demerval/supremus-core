'use strict';

const Types = require('../enum/types');

class FirebirdEstruturaFactory {

  constructor(tabela) {
    this.tabela = tabela;
    this.sqlCriarTabela = '';
    this.sqlCriarPrimaryKey = '';
    this.qlCriarGenerator = '';
    this.nomeTabela = tabela.getNome();
    this.nomeGerador = tabela.getNomeGerador();
    this.versao = tabela.getVersao();
    this.camposDB = [];
    this.verificar = tabela.isVerificar();
    this.chavesEstrangeiras = tabela.getChavesEstrangeiras();
  }

  async onVerificado() {
    await this.tabela.onUpdateDb(this.versao);
  }

  getSqlCriarTabela() {
    return this.sqlCriarTabela;
  }

  getSqlCriarPrimaryKey() {
    return this.sqlCriarPrimaryKey;
  }

  getSqlCriarGenerator() {
    return this.sqlCriarGenerator;
  }

  getChavesEstrangeiras() {
    return this.chavesEstrangeiras;
  }

  getNomeTabela() {
    return this.nomeTabela;
  }

  getNomeGerador() {
    return this.nomeGerador;
  }

  getVersao() {
    return this.versao;
  }

  getCampos() {
    return this.camposDB;
  }

  isVerificar() {
    return this.verificar;
  }

  criarSql() {
    let sql = [];
    sql.push("CREATE TABLE ");
    sql.push(this.nomeTabela);
    sql.push(" (");

    for (let campo of this.tabela.getCampos()) {
      if (campo.tableName || campo.sql) {
        continue;
      }

      if (campo.name.indexOf('.') > -1) {
        campo.name = campo.name.split('.')[1];
      }

      this.camposDB.push(campo);
      let tipo = this.getTipoDB(campo);

      sql.push(campo.name.toUpperCase());
      sql.push(' ');
      sql.push(tipo);
      if (tipo === 'VARCHAR') {
        sql.push('(' + campo.maxLength + ')');
      }
      if (tipo === 'BLOB') {
        sql.push(' SUB_TYPE 1 SEGMENT SIZE 80');
      }
      if (campo.required || campo.primaryKey) {
        sql.push(' NOT NULL');
      }
      sql.push(', ');

      if (campo.primaryKey) {
        this.sqlCriarPrimaryKey = "ALTER TABLE " + this.nomeTabela + " "
          + "ADD CONSTRAINT PK_" + this.nomeTabela + " "
          + "PRIMARY KEY (" + campo.name + ");";

        if (this.nomeGerador) {
          this.sqlCriarGenerator = "CREATE SEQUENCE " + this.nomeGerador + ";";
        }
      }
    }

    let s = sql.join('');
    this.sqlCriarTabela = s.substring(0, s.length - 2) + ");";
  }

  getTipoDB(campo) {
    let tipo = undefined;

    switch (campo.type) {
      case Types.STRING:
        tipo = 'VARCHAR';
        break;
      case Types.INTEGER:
        tipo = 'INTEGER';
        break;
      case Types.DATE:
        tipo = 'DATE';
        break;
      case Types.DECIMAL:
        tipo = `CURRENCY_${campo.decimalPlaces}`
        break;
      case Types.BOOLEAN:
        tipo = 'T_YESNO';
        break;
      case Types.BIG_INT:
        tipo = 'BIGINT';
        break;
      case Types.SMALL_INT:
        tipo = 'SMALLINT';
        break;
      case Types.BLOB:
        tipo = 'BLOB';
        break;
      default:
        throw Error(`Tipo de campo não existe: ${campo.type}!`);
    }

    return tipo;
  }

}

module.exports = FirebirdEstruturaFactory;