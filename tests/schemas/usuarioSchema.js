const { Fields } = require(__basedir + '/index');

class UsuarioSchema {

  constructor() {
    this.nome = 'USUARIOS';
    this.versao = 1;
    this.campos = this.getCampos();
  }

  getCampos() {
    let campos = new Map();

    campos.set('id', Fields.id.idIntegerAutoIncrement('codigo'));
    campos.set('nome', Fields.string.string('nome', 60, { required: true, unique: true }));
    campos.set('senha', Fields.string.string('senha', 60, { noneCase: true }));
    campos.set('tipo', Fields.string.string('tipo', 10, { lowerCase: true }));
    campos.set('dataAlteracao', Fields.date.dateUpdate());

    return campos;
  }

};

module.exports = UsuarioSchema;
