var mysql = require('mysql');
var config = require('../config/dbConfig')();

module.exports = function () {
    return mysql.createConnection(config);
};