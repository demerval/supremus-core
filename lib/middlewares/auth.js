const jwt = require('jsonwebtoken');
const authConfig = require(__basedir + '/config/auth');

module.exports = (req, res, next) => {
  const autheader = req.headers.authorization;
  if (!autheader) {
    return res.status(401).send({ error: 'Não foi informado o token de autorização!' });
  }

  const parts = autheader.split(' ');
  if (!parts.length === 2) {
    return res.status(401).send({ error: 'Erro no token informado!' });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).send({ error: 'Token formato inválido!' });
  }

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: 'Token inválido!' });
    }

    req.user = decoded;

    return next();
  });
}