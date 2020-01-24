const bcrypt = require('bcryptjs');

module.exports = async (campo, value) => {
  const hash = bcrypt.hash(value, 10);
  return hash;

}