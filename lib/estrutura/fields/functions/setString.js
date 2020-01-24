module.exports = async (campo, value, like) => {
  let newValue;

  if (value === null) {
    return null;
  }

  if (campo.noneCase) {
    newValue = value.trim();
  } else if (campo.lowerCase) {
    newValue = value.trim().toLowerCase();
  } else {
    newValue = value.trim().toUpperCase();
  }

  if (like) {
    if (like === 'LIKE_2' || like === 'inicia') {
      return newValue + '%';
    } else {
      return '%' + newValue + '%';
    }
  }

  return newValue;
}