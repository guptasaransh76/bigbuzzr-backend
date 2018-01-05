var express = require('express');
var router = express.Router();


const createResponse = function(req, res, next) {
  if (res.appData) {
    const appData = JSON.stringify(res.appData);
    res.appData = undefined;
    res.setHeader('Content-Type', 'application/json');
    return res.send(appData);
  } else {
    next();
  }
};

module.exports.createResponse = createResponse;
