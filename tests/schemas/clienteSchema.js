const { Fields } = require(__basedir + '/index');

class ClienteSchema {

  constructor() {
    this.nome = 'CLIENTES';
    this.versao = 1;
    this.verificar = false;
    this.campos = this.getCampos();
  }

  getCampos() {
    let campos = new Map();

    campos.set('id', Fields.id.idIntegerAutoIncrement('codigo'));
    campos.set('dataCadastro', Fields.date.dateRegister('data_cadastro'));
    campos.set('razao', Fields.string.stringRequiredUnique('razao', 60));
    campos.set('fantasia', Fields.string.string('fantasia'));
    campos.set('doc1', Fields.string.string('doc1', 20));
    campos.set('doc2', Fields.string.string('doc2', 20));
    campos.set('tel1', Fields.phone.phone('tel1'));
    campos.set('tel2', Fields.phone.phone('tel2'));
    campos.set('email', Fields.string.string('email', 200));
    campos.set('contatoNome', Fields.string.string('contato_nome'));
    campos.set('contatoTel', Fields.phone.phone('contato_tel'));
    campos.set('idLogradouro', Fields.integer.integer('cod_logradouro'));
    campos.set('numero', Fields.string.string('numero', 10));
    campos.set('complemento', Fields.string.string('complemento'));
    campos.set('obs', Fields.string.string('obs', 200));
    campos.set('idCondicaoPagto', Fields.integer.integer('cod_condicao_pagto'));
    campos.set('idTipoDoc', Fields.integer.integer('cod_tipo_doc'));
    campos.set('idVendedor', Fields.integer.integer('cod_vendedor'));
    campos.set('idPortador', Fields.integer.integer('cod_portador'));
    campos.set('dataFundacao', Fields.date.date('data_nascimento'));
    campos.set('idEmpresa', Fields.integer.integerRequired('cod_empresa'));
    campos.set('limiteCredito', Fields.decimal.decimal('limite_credito', 2));
    campos.set('comissao', Fields.decimal.decimal('comissao', 'comissao', 2));
    campos.set('tipo', Fields.boolean.boolean('tipo'));
    campos.set('idSituacao', Fields.integer.smallIntRequired('cod_situacao'));
    campos.set('tipoContribuinte', Fields.integer.smallInt('tipo_contribuinte'));
    campos.set('cliente', Fields.boolean.boolean('cliente'));
    campos.set('consumidorFinal', Fields.boolean.boolean('consumidor_final'));
    campos.set('fornecedor', Fields.boolean.boolean('fornecedor'));
    campos.set('transportadora', Fields.boolean.boolean('transportador'));
    campos.set('terceiro', Fields.boolean.boolean('terceiro'));
    campos.set('representante', Fields.boolean.boolean('representante'));
    campos.set('dataAlteracao', Fields.date.dateUpdate());
    campos.set('alteradoPor', Fields.string.string('alterado_por'));

    return campos;
  }

};

module.exports = ClienteSchema;
