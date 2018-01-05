var express = require('express');
var router = express.Router();
var logger = require('../utilities/logger');
var labels = require('../labels/auth');
var psgen = require('../utilities/authUtil');
var dbUtils = require('../utilities/dbUtil');
var mysql = require('mysql');

function createUser(req, res, next) {
  logger.info("Users create - start");
  if (req.user && req.user.role === "admin") {
    return createNewUser();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  }

  function createNewUser() {
    let query = 'INSERT INTO USERS SET ?';

    const salt = psgen.genRandomString();
    const passMap = psgen.sha512(req.body.password, salt);

    const params = {
      "user_name": req.body.username,
      "password": passMap.passwordHash,
      "salt": passMap.salt,
      "name": req.body.name,
      "role": req.body.role
    };

    dbUtils.query(query, params)
      .then(getResults)
      .catch(function(err, message) {
        logger.info(err, message);
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getResults(results, fields) {
    req.body.user_id = results.insertId;

    let query = 'SELECT * FROM ?? WHERE ?? = ?';
    const params = ['users', 'user_id', req.body.user_id];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(getCreatedUser)
      .catch(function(err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }
  function getCreatedUser(results, fields) {
    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': err
      };

      return next();
    }

    let user = results[0];
    delete user.password;
    delete user.salt;

    res.appData = {
      'status': 'success',
      'message': '',
      'data': user
    };

    return next();
  }
};

function getUsersAll(req, res, next) {
  logger.info("Users get_info_all - start");
  if (req.user && req.user.role === "admin") {
    return getAllUser();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
    return next();
  }

  function getAllUser() {
    let query = 'SELECT * FROM users';

    dbUtils.query(query, [])
      .then(getResults)
      .catch(function(err, message) {
        logger.info(err);
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getResults(results, field) {
    logger.info("Users get_info_all_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': err
      };

      return next();
    }
    for (var i = 0; i < results.length; i++) {
      delete results[i].password;
      delete results[i].salt;
    }
    res.appData = {
      'status': 'success',
      'message': '',
      'data': results
    };

    return next();
  }
};

function getUserInfo(req, res, next) {
  logger.info("Users get_info_specific - start");
  if (req.user) {
    return getSelectedUser();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
    return next();
  }

  function getSelectedUser() {
    let query = 'SELECT * FROM ?? WHERE ?? = ?';
    const params = ['users', 'user_id', req.params.user_id];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(getSpecifiedUser)
      .catch(function(err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getSpecifiedUser(results, field) {
    logger.info("Users get_specified_info_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'user not found'
      };

      return next();
    }

    let user = results[0];
    delete user.password;
    delete user.salt;

    res.appData = {
      'status': 'success',
      'message': '',
      'data': user
    };

    return next();
  }
};

function updateUserInfo(req, res, next) {
  logger.info("Users update_info_specific - start");

  if (req.user.role === 'admin') {
    return updateAdminUser();
  } else if (req.user.role === 'master') {
    return updateMasterUser();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
  }

  function updateAdminUser() {
    let query = 'UPDATE users SET ?? = ?, ?? = ? WHERE ?? = ?';

    const params =
      [ "name",
        req.body.name,
        "role",
        req.body.role,
        'user_id',
        req.params.user_id
      ];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(updateSpecifiedUserAdmin)
      .catch(function(err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function updateSpecifiedUserAdmin(results, field) {
    logger.info("Users update_specified_user_admin_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'user not found'
      };

      return next();
    }

    res.appData = {
      'status': 'success',
      'message': '',
      'data': results
    };

    return next();
  }

  function updateMasterUser() {
    let query = 'UPDATE users SET ?? = ? WHERE ?? = ?';

    const params =
      [ "name",
        req.body.name,
        'user_id',
        req.params.user_id
      ];

    query = mysql.format(query, params);
    dbUtils.query(query, [])
      .then(updateSpecifiedUserMaster)
      .catch(function(err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });

  }

  function updateSpecifiedUserMaster(results, field) {
    logger.info("Users update_specified_user_master_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'user not found'
      };

      return next();
    }

    res.appData = {
      'status': 'success',
      'message': '',
      'data': results
    };

    return next();
  }
};

function delUserInfo(req, res, next) {
  logger.info("Users delete_info_specific - start");
  if (req.user || req.user.role === "admin") {
    deleteUser();
  } else {
    res.appData = {
      status: 'failure',
      message: 'unauthorized'
    };
  }

  function deleteUser() {
    let query = 'DELETE FROM ?? WHERE ?? = ?';

    const params = ['users', 'user_id', req.params.user_id];

    query = mysql.format(query, params);
    dbUtils.query(query, [])
      .then(deleteSelectedUser)
      .catch(function(err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function deleteSelectedUser(results, field) {
    logger.info("Users delete_user_results - start");

    res.appData = {
      'status': 'success',
      'message': 'user deleted'
    };

    return next();
  }
};

router.post('/', createUser);
router.get('/', getUsersAll);
router.get('/:user_id', getUserInfo);
router.delete('/:user_id', delUserInfo);
router.patch('/:user_id', updateUserInfo);
module.exports = router;
