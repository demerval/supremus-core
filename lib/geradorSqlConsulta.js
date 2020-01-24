const Models = require('./models');
const SqlUtil = require('./sqlConsultaUtil');

class GeradorSqlConsulta {

  async getSql(config) {
    try {
      if (!config.table) {
        throw new Error(`Erro na configuração da consulta faltando: table`);
      }

      this.models = new Map();
      this.camposConsulta = '';
      this.joins = [];
      this.tabelaPadrao = '';
      this.where = '';
      this.params = [];
      this.orderBy = '';

      this._prepararModels(config.table);
      this._prepararCampos(config.fields);

      if (config.joins) {
        this._prepararJoins(config.joins);
      }

      if (config.where) {
        const { where, params } = await SqlUtil.prepararCriterio(this.models, this.tabelaPadrao, config.where, config.params);
        this.where = where;
        this.params = params;
      }

      if (config.orderBy) {
        this.orderBy = SqlUtil.prepararOrderBy(this.models, this.tabelaPadrao, config.orderBy);
      }

      console.log(`SELECT ${this.camposConsulta} 
      FROM ${this.models.get(this.tabelaPadrao).getNome()} ${this.joins.join(' ')}
      WHERE ${this.where}
      ORDER BY ${this.orderBy}`);

    } catch (error) {
      throw new Error(error.message);
    }
  }

  _prepararModels(table) {
    const comandos = this._prepararComando(table);

    for (let cmd of comandos) {
      if (cmd.length > 2) {
        throw new Error(`Erro no camando table: ${cmd.join(' ')}`);
      }

      const model = Models.getModel(cmd[0]);
      this.models.set(cmd.length === 2 ? cmd[1] : cmd[0], model);
    }

    this.tabelaPadrao = [...this.models.keys()][0];
  }

  _prepararCampos(fields) {
    if (fields === undefined) {
      console.log('todos os campos');
      return;
    }

    const qtdeModels = this.models.size;
    const comandos = this._prepararComandoComPonto(this._prepararComando(fields));
    const camposMap = new Map();
    const campos = [];

    for (let cmd of comandos) {
      if (cmd.length > 2) {
        throw new Error(`Erro no camando field: ${cmd.join(' ')}`);
      }
      if (cmd.length === 1 & qtdeModels > 1) {
        throw new Error(`Erro no camando field: ${cmd.join(' ')}, foi informado sem o nome da tabela`);
      }

      const tabela = cmd.length === 1 ? this.tabelaPadrao : cmd[0];
      const valor = cmd.length === 1 ? cmd[0] : cmd[1];

      let camposConsulta = camposMap.get(tabela);
      if (camposConsulta === undefined) {
        camposConsulta = [valor];
        camposMap.set(tabela, camposConsulta);
      } else {
        camposConsulta.push(valor);
      }
    }

    for (let [key, values] of camposMap) {
      const camposSelect = SqlUtil.getCamposConsulta(this.models.get(key), values);
      campos.push(...camposSelect);
    }

    this.camposConsulta = campos.join(', ');
  }

  _prepararJoins(joins) {
    if (joins instanceof Array === true) {
      for (let join of joins) {
        this._prepararJoin(join);
      }

      return;
    }

    this._prepararJoin(joins);
  }

  _prepararJoin(value) {
    let joinType = 'INNER';
    let join = '';

    if (typeof value === 'string') {
      join = value;
    } else {
      if (!value.type) {
        throw new Error(`Erro no joins: ${JSON.stringify(value)}, não foi informado o type.`);
      }
      if (!value.join) {
        throw new Error(`Erro no joins: ${JSON.stringify(value)}, não foi informado o join.`);
      }

      joinType = value.type;
      join = value.join;
    }

    const campos = [];
    const comandos = this._prepararComando(join, '=');
    for (let cmd of comandos) {
      const item = this._prepararComandoComPonto(cmd[0]);

      const model = this.models.get(item[0][0]);
      if (model === undefined) {
        throw new Error(`Erro no join: ${JSON.stringify(join)}, tabela não localizada.`);
      }

      const campo = model.getCampo(item[0][1]);
      if (campo === undefined) {
        throw new Error(`Erro no join: ${JSON.stringify(join)}, campo (${item[0][1]}) não localizado.`)
      }

      campos.push(campo.name);
    }

    this.joins.push(`${joinType} JOIN ${campos.join(' = ')}`);
  }

  _prepararComando(value, tipo = ',') {
    const comandos = [];
    let sVirgula = value.trim().split(tipo);

    for (let s of sVirgula) {
      let cmd = s.trim().split(' ');
      comandos.push(cmd.filter(m => m !== ''));
    }

    return comandos;
  }

  _prepararComandoComPonto(values) {
    const comandos = [];

    if (typeof values === 'string') {
      let sPonto = values.trim().split('.');
      comandos.push(sPonto.filter(m => m !== ''));

      return comandos;
    }

    for (let cmd of values) {
      let sPonto = cmd[0].trim().split('.');
      comandos.push(sPonto.filter(m => m !== ''));
    }

    return comandos;
  }

}

module.exports = GeradorSqlConsulta;