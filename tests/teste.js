const path = require('path');
global.__basedir = path.resolve(__dirname, '../');

const { VerificarEstruturaDB, Enums } = require('../index');

const Controller = require('./controllers/basico');

async function cadastrarUsuarioSuporte() {
  const usuarios = await Controller.consultar('usuario', { criterio: { nome: 'suporte' } });

  if (usuarios.length === 0) {
    let usuario = {
      nome: 'suporte',
      senha: 'SupremuS@1212',
      tipo: 'admin',
    }

    return await Controller.salvar('usuario', usuario, Enums.Status.INSERT);
  }

  return usuarios[0];
}

async function listaTodos() {
  return await Controller.consultar('usuario');
}

async function testeConsultaPaginada() {
  const consulta = {
    first: 10,
    skip: 0,
    criterio: [{ tipo: 'admin' }],
    fieldsConsulta: ['id', 'nome', 'tipo'],
    orderBy: ['nome'],
  }

  return await Controller.consultaPaginada('usuario', consulta);
}

async function testeExcluirUsuario(id) {
  return await Controller.excluir('usuario', id, ['id', 'nome']);
}

async function testes() {
  await new VerificarEstruturaDB().verificarEstruturaModels('./tests/models');
  //await VerificarUpdateDados.verificarUpdate(1, '/tests/updates');

  /*tituloTeste('Criar usuário suporte');
  const usuario = await cadastrarUsuarioSuporte();
  console.log(usuario);

  tituloTeste('Listar todos usuários');*/
  const listaTodosUsuarios = await listaTodos();
  /*console.log(listaTodosUsuarios);

  tituloTeste('Consulta paginada - Página 1, 10 registros por página');
  const lista = await testeConsultaPaginada();
  console.log(lista);

  tituloTeste('Excluir usuário');
  const usuarioExcluido = await testeExcluirUsuario(1);
  console.log(usuarioExcluido);*/
}

function tituloTeste(titulo) {
  separador();
  console.log(`  ${titulo}`);
  separador();
}

function separador() {
  console.log('--------------------------------------------------------------------------------');
}

testes()
  .then(() => {
    separador();
    console.log('  *** FIM ***');
  })
  .catch(error => {
    console.log(error.message);
    separador();
    console.log('  *** Finalizou com erro ***');
  });