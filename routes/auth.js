var express = require('express');
var crypto = require('crypto');
var mysql = require('mysql');
var router = express.Router();
var logger = require('../utilities/logger');
var labels = require('../labels/auth');
var psgen = require('../utilities/authUtil');
var dbUtils = require('../utilities/dbUtil');

/**
 * generate a hash and salt for a password
 * @function
 * @param req
 * @param res
 */
const generateHashCode = function (req, res) {
  var salt = psgen.genRandomString();
  var password = psgen.sha512(req.query.pass, salt);

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(password));
};

/**
 * login method, for already existing sessions
 * it will override the session
 * @param req
 * @param res
 */
function login(req, res) {
  logger.info("Auth login - start");

  //Call validate
  validate();

  function validate() {
    if (!req.body.username || !req.body.password) {
      return sendResponse('failure', labels('err_request_body_missing'));
    }

    return getUser();
  };

  function getUser() {
    const query = 'SELECT * FROM users WHERE user_name = ?';
    const params = [req.body.username];

    dbUtils.query(query, params)
      .then(authenticate)
      .catch(function (err, message) {
        return sendResponse('failure', message);
      });
  };

  function authenticate(results, fields) {
    if (results.length <= 0) {
      return sendResponse('failure', labels('err_user_not_found'));
    }

    const reqPassword = psgen.sha512(req.body.password, results[0].salt);

    if (reqPassword.passwordHash === results[0].password) {
      const query = 'UPDATE users SET last_login = ? where user_id = ?';
      const CURRENT_TIMESTAMP = mysql.raw('CURRENT_TIMESTAMP()');
      const params = [CURRENT_TIMESTAMP, results[0].user_id];
      return dbUtils.query(query, params)
        .then(function(r, f) {
          req.session.user_id = results[0].user_id;
          return sendResponse('success', labels('info_login_success'));
        })
        .catch(function(err, message) {
          return sendResponse('failure', message);
        });

    }
    return sendResponse('failure', labels('err_authentication_failed'));
  };

  function sendResponse(status, message) {
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({
      'status': status,
      'message': message
    }));
  };
};

/**
 * function to logout
 * @param req
 * @param res
 */
function logout(req, res) {
  logger.info("Auth logout - start");

  if (req.session.user_id) {
    req.session.user_id = undefined;
    return sendResponse('success', labels('info_logout_success'));
  }

  return sendResponse('failure', labels('err_logout_not_found'));

  function sendResponse(status, message) {
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({
      'status': status,
      'message': message
    }));
  };
};

const isAuthenticated = function (req, res) {
  logger.info("Auth isAuthenticated - start");

  if (req.user) {
    return sendResponse('success', '', req.user);
  } else {
    return sendResponse('failure', '');
  }

  function sendResponse(status, message, data) {
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({
      'status': status,
      'message': message,
      'data': data
    }));
  };
};

const isValidUser = function (user_id) {
  logger.info("Auth verify - start");

  if (!user_id) {
    return undefined;
  }

  getUser();

  function getUser() {
    const query = 'SELECT * FROM users WHERE user_id = ?';
    const params = [user_id];

    dbUtils.query(query, params)
      .then(validate)
      .catch(function (err, message) {
        return sendResponse('failure', message);
      });
  };

  function validate(results, fields) {
    if (results <= 0) {
      return false;
    }

    return true;
  }
};

const options = function(req, res, next) {
  res.render('index', { title: 'Express' });
};

router.post('/login', login);
router.options('/', options);
router.post('/logout', logout);
router.get('/generateCode', generateHashCode);
router.get('/isAuthenticated', isAuthenticated);

module.exports = router;
module.exports.isValidUser = isValidUser;