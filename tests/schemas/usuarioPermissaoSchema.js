const { Fields } = require(__basedir + '/index');

class UsuarioSchema {

  constructor() {
    this.nome = 'USUARIOS_PERMISSAO';
    this.versao = 1;
    this.campos = this.getCampos();
    this.chaveEstrangeiraConfig = [{
      chaveEstrangeira: 'cod_usuario',
      tabelaNome: 'usuarios',
      tabelaCampo: 'codigo',
      onUpdate: 'CASCADE', // Caso seja omitido o padrão é RESTRICT.
      onDelete: 'CASCADE', // Caso seja omitido o padrão é RESTRICT.
    }]
  }

  getCampos() {
    let campos = new Map();

    campos.set('id', Fields.id.idIntegerAutoIncrement('codigo'));
    campos.set('idUsuario', Fields.integer.integerRequired('cod_usuario'));
    campos.set('permissao', Fields.string.string('permissa0'));
    campos.set('dataAlteracao', Fields.date.dateUpdate());

    return campos;
  }

};

module.exports = UsuarioSchema;
