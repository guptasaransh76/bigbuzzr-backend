const labels = {
  'err_mysql_connection'          : 'not able to connect to database',
  'err_mysql_query'               : 'not albe to query database'
};

module.exports = function (key) {
  return labels[key] ? labels[key] : "undefined_label";
};