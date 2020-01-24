const fs = require('fs');
const path = require('path');
const FirebirdEstruturaFactory = require('./estruturaFactory');
const DAO = require('../DAO');
const cnnFB = require('../connectionFactory');
const Models = require('../models');

class EstruturaVerificar {

  constructor() {
    this.dao = new DAO(cnnFB);
    this.chavesEstrangeiras = [];
  }

  async verificarEstruturaModels(dirModels) {
    try {
      await this.dao.openConexao(false);

      let EstruturaVersaoModel = require('./models/estruturaVersaoModel');
      await this._executarVerificacao(new EstruturaVersaoModel());

      let UpdateVersaoModel = require('./models/updateVersaoModel');
      await this._executarVerificacao(new UpdateVersaoModel());

      const dir = path.resolve(__basedir, dirModels);
      await this._verificarPastas(dir);

      if (this.chavesEstrangeiras.length > 0) {
        await this._criarChavesEstrangeiras();
      }

      return true;
    } catch (error) {
      throw new Error(error.message);
    } finally {
      this.dao.closeConexao();
    }
  }

  async _verificarPastas(dir) {
    const files = fs.readdirSync(dir);

    for (let file of files) {
      const dirFile = path.resolve(dir, file);

      if (fs.lstatSync(dirFile).isDirectory() === true) {
        await this._verificarPastas(dirFile);
      } else if (file.indexOf('.js') !== 0) {
        let Model = require(dirFile);
        Models.addModel(new Model().getNomeModel(), dirFile);
        await this._executarVerificacao(new Model());
      }
    }
  }

  async _executarVerificacao(model) {
    let fef = new FirebirdEstruturaFactory(model);
    if (!fef.isVerificar()) {
      return;
    }
    fef.criarSql();

    if (fef.getChavesEstrangeiras().length > 0) {
      this.chavesEstrangeiras.push({ tabela: fef.getNomeTabela(), config: [...fef.getChavesEstrangeiras()] });
    }

    const existe = await this._tabelaExiste(fef.getNomeTabela());
    if (existe === true) {
      return this._verificarTabela(fef);
    } else {
      return this._criarTabela(fef);
    }
  }

  async _tabelaExiste(tabela) {
    const sql = 'SELECT RDB$RELATION_NAME FROM RDB$RELATIONS '
      + 'WHERE RDB$RELATION_NAME = ?';

    const rows = await this.dao.executarSql(sql, [tabela]);
    return (rows.length === 1);
  }

  async _verificarTabela(fef) {
    const tabela = fef.getNomeTabela();
    const sql = 'SELECT VERSAO FROM ESTRUTURA_VERSAO WHERE TABELA = ?';

    let rows = await this.dao.executarSql(sql, [tabela]);
    if (rows.length === 0) {
      const existe = await this._tabelaExiste(tabela);
      if (existe === false) {
        return this._criarTabela(fef);
      }

      await this._ajustarTabela(fef);
      return await this._atualizarVersaoTabela(fef);
    }

    if (fef.getVersao() <= rows[0].VERSAO) {
      return 'ATUALIZADO';
    }

    await this._ajustarTabela(fef);
    return await this._atualizarVersaoTabela(fef);
  }

  async _criarTabela(fef) {
    await this.dao.executarSql(fef.getSqlCriarTabela());
    if (fef.getSqlCriarPrimaryKey()) {
      await this._criarChavePrimaria(fef.getSqlCriarPrimaryKey(), fef.getNomeTabela());
    }
    if (fef.getSqlCriarGenerator()) {
      await this._criarGerador(fef.getSqlCriarGenerator(), fef.getNomeGerador());
    }

    return await this._atualizarVersaoTabela(fef);
  }

  async _criarChavePrimaria(sql, tabela) {
    const existe = await this._chavePrimariaExiste(tabela);
    if (existe === true) {
      return;
    }

    return await this.dao.executarSql(sql);
  }

  async _chavePrimariaExiste(tabela) {
    let sql = "SELECT RDB$FIELD_NAME FROM RDB$RELATION_CONSTRAINTS C, RDB$INDEX_SEGMENTS S WHERE "
      + "C.RDB$CONSTRAINT_TYPE = 'PRIMARY KEY' AND S.RDB$INDEX_NAME = C.RDB$INDEX_NAME "
      + "AND RDB$RELATION_NAME = ?";

    const rows = await this.dao.executarSql(sql, [tabela.toUpperCase()]);
    return (rows.length === 1);
  }

  async _criarGerador(sql, nomeGerador) {
    const existe = await this._geradorExiste(nomeGerador);
    if (existe === true) {
      return;
    }

    return await this.dao.executarSql(sql);
  }

  async _geradorExiste(nomeGerador) {
    let sql = "SELECT RDB$GENERATOR_NAME FROM RDB$GENERATORS "
      + "WHERE RDB$GENERATOR_NAME = ?";

    const rows = await this.dao.executarSql(sql, [nomeGerador.toUpperCase()]);
    return (rows.length === 1);
  }

  async _atualizarVersaoTabela(fef) {
    let sql = "UPDATE OR INSERT INTO ESTRUTURA_VERSAO "
      + "(TABELA, VERSAO) "
      + "VALUES ('" + fef.getNomeTabela() + "', " + fef.getVersao() + ") "
      + "MATCHING (TABELA);";

    const ok = await this.dao.executarSql(sql);
    await fef.onVerificado();

    return ok;
  }

  async _ajustarTabela(fef) {
    const campos = fef.getCampos();
    for (let it in campos) {
      await this._verificarCampo(fef, campos[it]);
    }

    return true;
  }

  async _verificarCampo(fef, campo) {
    let sql = "SELECT RDB$RELATION_NAME, RDB$FIELD_NAME FROM RDB$RELATION_FIELDS "
      + "WHERE RDB$FIELD_NAME = ? AND RDB$RELATION_NAME = ?";

    const rows = await this.dao.executarSql(sql, [campo.name, fef.getNomeTabela()]);
    if (rows.length === 0) {
      return this._criarCampo(fef, campo);
    }
    if (fef.getTipoDB(campo) === 'VARCHAR') {
      return this._ajustarCampo(fef, campo);
    }

    return true;
  }

  async _criarCampo(fef, campo) {
    const tipo = fef.getTipoDB(campo);
    let sql = "ALTER TABLE " + fef.getNomeTabela() + " ADD "
      + campo.name + " " + tipo;
    if (tipo === "VARCHAR") {
      sql += "(" + campo.maxLength + ")";
    }
    if (campo.required || campo.primaryKey) {
      sql += " NOT NULL";
    }

    await this.dao.executarSql(sql);
    if (campo.primaryKey) {
      await this._criarChavePrimaria(fef.getSqlCriarPrimaryKey(), fef.getNomeTabela());
    }
    if (fef.getNomeGerador()) {
      await this._criarGerador(fef.getSqlCriarGenerator(), fef.getNomeGerador());
    }

    return true;
  }

  async _ajustarCampo(fef, campo) {
    const ajustar = await this._verificarTamanhoCampo(fef.getNomeTabela(), campo.name, campo.maxLength);
    if (ajustar === true) {
      let sql = "ALTER TABLE " + fef.getNomeTabela() + " ALTER "
        + campo.name + " TYPE VARCHAR("
        + campo.maxLength + ");";

      await this.dao.executarSql(sql);
    }

    return true;
  }

  async _verificarTamanhoCampo(tabela, campo, tamanho) {
    const sql = "SELECT RDB$RELATION_FIELDS.RDB$FIELD_NAME FIELD_NAME, "
      + "RDB$FIELDS.RDB$FIELD_LENGTH FIELD_SIZE "
      + "FROM RDB$RELATION_FIELDS "
      + "JOIN RDB$FIELDS "
      + "ON RDB$FIELDS.RDB$FIELD_NAME = "
      + "RDB$RELATION_FIELDS.RDB$FIELD_SOURCE "
      + "JOIN RDB$TYPES "
      + "ON RDB$FIELDS.RDB$FIELD_TYPE = RDB$TYPES.RDB$TYPE AND "
      + "RDB$TYPES.RDB$FIELD_NAME = 'RDB$FIELD_TYPE' "
      + "WHERE RDB$RELATION_FIELDS.RDB$RELATION_NAME = '" + tabela + "'"
      + "AND RDB$RELATION_FIELDS.RDB$FIELD_NAME = '" + campo + "';";

    const rows = await this.dao.executarSql(sql);
    if (rows.length === 0) {
      return false;
    }

    return (tamanho > rows[0].FIELD_SIZE);
  }

  async _criarChavesEstrangeiras() {
    for (let chave of this.chavesEstrangeiras) {
      const tabela = chave.tabela.toUpperCase();

      for (let config of chave.config) {
        const existe = await this._verificarChaveEstrangeiraExiste(tabela, config.chaveEstrangeira);
        if (existe === true) {
          continue;
        }

        const indice = await this._indiceChaveEstrangeira(tabela);
        const nomeFk = `FK_${tabela}_${indice}`;
        const onUpdate = config.onUpdate ? config.onUpdate.toUpperCase() : 'RESTRICT';
        const onDelete = config.onDelete ? config.onDelete.toUpperCase() : 'RESTRICT';

        const sql = "alter table " + tabela + " "
          + "add constraint " + nomeFk.toUpperCase() + " "
          + "foreign key (" + config.chaveEstrangeira.toUpperCase() + ") "
          + "references " + config.tabelaNome.toUpperCase() + " (" + config.tabelaCampo.toUpperCase() + ") "
          + "on update " + onUpdate + " "
          + "on delete " + onDelete;
        
        await this.dao.executarSql(sql);
      }
    }

    return true;
  }

  async _verificarChaveEstrangeiraExiste(tabela, campo) {
    const sql = "SELECT RDB$FIELD_NAME FROM RDB$RELATION_CONSTRAINTS C, RDB$INDEX_SEGMENTS S "
      + "WHERE C.RDB$CONSTRAINT_TYPE = 'FOREIGN KEY' "
      + "AND S.RDB$INDEX_NAME = C.RDB$INDEX_NAME "
      + "AND RDB$RELATION_NAME = ? "
      + "AND RDB$FIELD_NAME = ?";

    const result = await this.dao.executarSql(sql, [tabela.toUpperCase(), campo.toUpperCase()]);
    return (result.length === 1);
  }

  async _indiceChaveEstrangeira(tabela) {
    const sql = "SELECT r.RDB$CONSTRAINT_NAME AS NOME, r.RDB$INDEX_NAME AS INDEX_NAME "
      + "FROM RDB$RELATION_CONSTRAINTS r "
      + "WHERE RDB$RELATION_NAME = ? "
      + "AND RDB$CONSTRAINT_TYPE = 'FOREIGN KEY'";

    let indice = 0;
    const valores = [];
    const rows = await this.dao.executarSql(sql, [tabela]);

    for (let row of rows) {
      let s = row.INDEX_NAME.split('_');
      valores.push(parseInt(s[s.length - 1]));
    }

    if (valores.length > 0) {
      valores.sort((a, b) => a - b);
      indice = (valores[valores.length - 1] + 1);
    }

    return indice;
  }

}

module.exports = EstruturaVerificar;