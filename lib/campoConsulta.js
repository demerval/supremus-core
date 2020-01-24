const Operador = require('./enum/operador');

class CampoConsulta {

  constructor(config) {
    let params = this.initConfig(config);

    this.tabela = params.tabela;
    this.campo = params.campo;

    this.operador = params.operador;
    this.comparador = params.comparador;

    this.valor = params.valor;
    this.valor2 = params.valor2;
  }

  static get Operador() {
    return Operador;
  }

  initConfig(config) {
    let index = 0;
    let params = {};

    Object.getOwnPropertyNames(config).forEach(name => {
      let value = config[name];
      switch (index) {
        case 0:
          this.initValues(params, name, value);
          break;
        case 1:
          if (!this.initComparador(params, value)) {
            if (!params.operador) {
              this.initOperador(params, value);
            }
          }
          break;
        case 2:
          this.initComparador(params, value);
          break;
      }
      index++;
    });

    if (!params.operador) {
      params.operador = Operador.IGUAL;
    }
    if (!params.comparador) {
      params.comparador = 'AND';
    }

    return params;
  }

  initValues(params, name, values) {
    let c = name.split('.');

    if (c.length === 1) {
      params.tabela = undefined;
      params.campo = c[0];
    } else {
      params.tabela = c[0];
      params.campo = c[1];
    }

    if (values instanceof Array) {
      params.valor = values[0];
      params.valor2 = values[1];
      params.operador = Operador.INTERVALO;
    } else {
      params.valor = values;
    }
  }

  initComparador(params, value) {
    if (value === 'AND' || value === 'OR') {
      params.comparador = value;
      return true;
    }

    return false;
  }

  initOperador(params, value) {
    Object.getOwnPropertyNames(Operador).forEach(name => {
      if (Operador[name] === value) {
        params.operador = value;
        return;
      }
    });
  }

}

module.exports = CampoConsulta;