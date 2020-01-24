const path = require('path');
global.__basedir = path.resolve(__dirname, '../');

const { VerificarEstruturaDB, TabelaConsulta, AND, OR, CONTEM, MAIOR_IGUAL, VerificarUpdateDados } = require(__basedir + '/index');
const UsuarioModel = require('./models/usuarioModel');
const ClienteModel = require('./models/clienteModel');

const usuarioConfig = require('./models/consulta/usuarioConsulta');

async function verificarEstrutura() {
  //await VerificarEstruturaDB.verificarEstruturaModels('/tests/models');
  //await VerificarUpdateDados.verificarUpdate(1, '/tests/updates');
}

async function consultar() {

  const criterio = [
    { dataCadastro: ['2018-05-01', '2018-05-05'] },
    { id: 1, OR },
    { 'clientes.nome': 'de', CONTEM }
  ];

  const usuario = new TabelaConsulta(usuarioConfig);

  console.log('*** Consulta Paginada ***');
  let rowsPag = await usuario.consultaPaginada(5, 0, criterio);
  console.log(rowsPag);

  console.log();
  console.log('*** Consultar por id ***');
  let rows = await usuario.consultar({ id: 1 });
  console.log(rows);
}

async function consultarUsuarioPorId() {
  let usuario = new UsuarioModel();
  let rows = await usuario.consultarPorId(1);
  console.log(rows);
}

async function consultarUsuario() {
  let usuario = new UsuarioModel();
  let rows = await usuario.consultar({ id: 1 });
  console.log(rows);
}

async function novoUsuario() {
  let dados = {
    nome: "Sem Nome",
    senha: '1414',
    clienteId: 1
  }

  let usuario = new UsuarioModel();
  await usuario.salvar(dados, UsuarioModel.Status.INSERT);
  return usuario.getItem();
}

async function updateUsuario() {
  let dados = {
    id: 1,
    nome: "Demerval",
    senha: '1212',
    clienteId: 1
  }

  let usuario = new UsuarioModel();
  await usuario.salvar(dados, UsuarioModel.Status.UPDATE);
  return usuario.getItem();
}

async function novoCliente() {
  let dados = {
    nome: "Demerval",
    tel1: '(32)3261-1010'
  }

  let cliente = new ClienteModel();
  await cliente.salvar(dados, ClienteModel.Status.INSERT);
  return cliente.getItem();
}

verificarEstrutura()
  .then(() => console.log('Fim verificação!'))
  .catch(error => console.log(error));

//consultar();
//consultarUsuarioPorId();
//consultarUsuario();
/*novoUsuario()
  .then(usuario => {
    console.log('*** Novo Usuario ***');
    console.log(usuario);
  })
  .catch(error => {
    console.log(error);
  });*/

//updateUsuario()
//  .then(usuario => {
//    console.log('*** Update Usuario ***');
//    console.log(usuario);
//  })
//  .catch(error => {
//    console.log(error);
//  });

/*novoCliente()
  .then(cliente => {
    console.log('*** Novo Cliente ***');
    console.log(cliente);
  })
  .catch(error => {
    console.log(error);
  });*/