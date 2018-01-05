var Promise = require('promise');
var labels = require('../labels/dbUtil');


const query = function (query, params) {
  return new Promise(function(resolve, reject) {
    const conn = require('./dbConnection')();
    conn.connect(function (err) {
      if (err) {
        return reject(err, labels('err_mysql_connection'));
      }

      return conn.query(query, params, function(err, results, fields) {
        if (err) {
          return reject(err, labels('err_mysql_query'));
        }

        return resolve(results, fields);
      });
    });
  });
};

module.exports.query = query;