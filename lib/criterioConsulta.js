const CampoConsulta = require('./campoConsulta');

module.exports = (criterios) => {
  const criterio = [];

  if (criterios instanceof Array === false) {
    let cr = criterios;
    criterios = [];
    criterios.push(cr);
  }

  for (let c of criterios) {
    if (c instanceof Array) {
      const campos = [];
      for (let c2 of c) {
        campos.push(new CampoConsulta(c2));
      }
      criterio.push(campos);
    } else {
      criterio.push(new CampoConsulta(c));
    }
  }

  return criterio;
}