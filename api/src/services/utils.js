function isValidDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

module.exports = { isValidDate };
