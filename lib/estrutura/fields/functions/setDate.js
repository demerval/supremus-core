const moment = require('moment');

module.exports = async (campo, value) => {
  if (value === '' || value === null) {
    return null;
  }

  if (moment(value, 'DD/MM/YYYY', true).isValid()) {
    return moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD');
  }

  return moment(value).format('YYYY-MM-DD');
}