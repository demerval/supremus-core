
class FieldsConsulta {

  constructor(tabelaBase) {
    this.tabelaBase = tabelaBase;
    this.campos = new Map();
    this.joins = [];
    this.tablesInfo = [];
    this.camposRemover = [];
  }

  init(tableName, fields) {
    this.campos.set(tableName, fields);
    this.separarTableInfo(tableName, fields);

    for (let key of this.camposRemover) {
      fields.delete(key);
    }

    for (let [key, values] of this.campos) {
      for (let campo of values.values()) {
        let name = campo.name.toUpperCase();
        if (name.indexOf('.') === -1) {
          campo.name = key + '.' + name;
          if (!campo.alias) {
            campo.alias = key + '_' + name;
          }
        }
      }
    }

    const joinCtl = new Map();
    for (let { key, name, tableName, tableNameJoin } of this.tablesInfo) {
      let join = joinCtl.get(tableNameJoin);
      if (!join) {
        let chavePrimaria = this.tabelaBase.getChavePrimaria(this.campos, tableNameJoin);
        if (!chavePrimaria) {
          throw Error(`Não foi localizada a chave primária da tabela ${tableNameJoin}!`);
        }

        let joinInfo = {
          tabela: tableNameJoin,
          on: `ON ${tableName}.${name.toUpperCase()} = ${chavePrimaria.name.toUpperCase()}`
        }

        this.joins.push(joinInfo);
        joinCtl.set(tableNameJoin, joinInfo);
      }
    }

    return { campos: this.campos, joins: this.joins };
  }

  separarTableInfo(tableName, fields) {
    for (let [key, campo] of fields) {
      if (campo.foreignKey && campo.tableInfo) {
        let tableInfo = campo.tableInfo;
        this.campos.set(tableInfo.nome.toUpperCase(), tableInfo.campos);
        this.camposRemover.push(key);
        this.tablesInfo.push({ key, name: campo.name, tableName: tableName, tableNameJoin: tableInfo.nome.toUpperCase() });

        this.separarTableInfo(tableInfo.nome.toUpperCase(), tableInfo.campos);
      }
    }
  }

}

module.exports = FieldsConsulta;