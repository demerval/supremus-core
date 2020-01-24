const Types = require('../lib/enum/types');

module.exports = {

  getCamposConsulta(model, fieldsConsulta) {
    let camposNome = [];
    const fields = model.getCamposMap();

    fieldsConsulta.forEach(fieldC => {
      const field = fields.get(fieldC);
      if (field === undefined) {
        throw new Error(`Campo não localizado: ${fieldC}`);
      }

      if (field.type === 'blob') {
        camposNome.push(`CAST(${field.name} AS VARCHAR(4096)) AS ${field.alias.toUpperCase()}`);
      } else {
        camposNome.push(field.name);
      }
    });

    return camposNome;
  },

  async prepararCriterio(models, modelPadrao, where, params) {
    const comandos = _separarComandos(where);
    return await _prepararWhere(models, modelPadrao, comandos, params);
  },

  prepararOrderBy(models, modelPadrao, orderBy) {
    const comandos = _separarComandos(orderBy, ',', false);
    const ordens = ['ASC', 'DESC'];
    let order = [];

    for (let cmdO of comandos) {
      let cmd = _separarComando(cmdO);
      if (cmd.length === 1) {
        const campoDb = _getCampo(models, modelPadrao, cmd[0], 'orderBy');
        const collate = campoDb.type === Types.STRING ? ' COLLATE WIN_PTBR' : '';
        order.push(`${campoDb.name}${collate}`);
      } else if (cmd.length === 2) {
        const campoDb = _getCampo(models, modelPadrao, cmd[0], 'orderBy');
        const ord = ordens.find(o => o === cmd[1].toUpperCase());
        if (ord === undefined) {
          throw new Error(`Erro no orderBy: ${JSON.stringify(cmd)}`);
        }
        const collate = campoDb.type === Types.STRING ? ' COLLATE WIN_PTBR' : '';
        order.push(`${campoDb.name}${collate} ${ord}`);
      } else {
        throw new Error(`Erro no orderBy: ${JSON.stringify(cmdO)}`);
      }
    }

    return order.join(', ');
  }

}

function _separarComandos(value, separador = ' ', subComando = true) {
  const comandos = [];
  let sSeparador = value.trim().split(separador);

  if (subComando === false) {
    return sSeparador;
  }

  for (let s of sSeparador) {
    comandos.push(..._separarComando(s));
  }

  return comandos;
}

function _separarComando(value) {
  const comandos = [];

  //for (let s of values) {
  let cmd = value.trim().split(' ');
  comandos.push(...cmd.filter(m => m !== ''));
  //}

  return comandos;
}

async function _prepararWhere(models, modelPadrao, comandos, parametros) {
  let where = '';
  let campoDb = null;
  let status = 'campo';
  let operadores = ['=', '<>', '!=', '~=', '^=', '<', '<=', '>', '>=', '!<', '~<', '^<', '!>', '~>', '^>', 'LIKE', 'BETWEEN'];
  let comparadores = ['AND', 'OR'];
  let operador = ';'
  let betweenValue = 0;
  let paramIndex = 0;
  let params = [];

  for (let cmd of comandos) {
    let campo = cmd.toUpperCase();

    if (campo === '(' || campo === ')') {
      where += `${campo} `;
      continue;
    }

    switch (status) {
      case 'campo':
        if (campo.indexOf('(') === 0) {
          where += '( ';
          campo = campo.substring(1, campo.length);
        }

        campoDb = _getCampo(models, modelPadrao, campo, 'where');
        where += `${campoDb.name} `;
        status = 'operador';
        if (campoDb.type === Types.STRING) {
          where += 'COLLATE WIN_PTBR ';
        }
        break;
      case 'operador':
        operador = operadores.find(o => o === campo);
        if (operador === undefined) {
          throw new Error(`Erro no comando where: operador não existe ${campo}`);
        }
        where += `${operador} `;
        status = 'valor';
        if (operador === 'BETWEEN') {
          betweenValue = 0;
        }
        break;
      case 'valor':
        let p = false;
        if (campo.indexOf(')') > 0) {
          campo = campo.replace(')', '');
          p = true;
        }
        where += `${campo}${p === true ? ' ) ' : ' '}`;
        status = 'comparador';
        if (campo === '?') {
          const value = await campoDb.setValue(campoDb, parametros[paramIndex]);
          params.push(value);
          paramIndex++;
        }
        if (operador === 'BETWEEN') {
          betweenValue++;
          if (betweenValue === 2) {
            operador = '';
          }
        }
        break;
      case 'comparador':
        if (operador === 'BETWEEN' && campo !== 'AND') {
          throw new Error(`Erro no comando where: comparador BETWEEN aguardando AND. Informado: ${campo}`);
        }
        let c = comparadores.find(i => i === campo);
        if (c === undefined) {
          throw new Error(`Erro no comando where: comparador não existe ${campo}`);
        }
        where += `${c} `;
        status = operador === 'BETWEEN' ? 'valor' : 'campo';
        break;
    }

  }

  return { where, params };
}

function _getCampo(models, modelPadrao, value, tipo) {
  let tabela = modelPadrao;
  let campoCmd = value.toLowerCase();

  if (value.indexOf('.') > 0) {
    let s = value.split('.');
    tabela = s[0].toLowerCase();
    campoCmd = s[1].toLowerCase();
  }

  const model = models.get(tabela);
  if (model === undefined) {
    throw new Error(`Erro no camando ${tipo}: tabela não localizado ${tabela}`)
  }

  const campo = model.getCampo(campoCmd);
  if (campo === undefined) {
    throw new Error(`Erro no comando ${tipo}: campo não localizado ${campoCmd}`);
  }

  return campo;
}