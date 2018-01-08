var express = require('express');
var mysql = require('mysql');
var randomstring = require('randomstring');

var router = express.Router();
var logger = require('../utilities/logger');
var dbUtils = require('../utilities/dbUtil');

startQuiz = function(req, res, next) {
    if (req.user) {
      return validateRunningQuiz();
    } else {
      res.appData = {
        'status': 'failure',
        'message': 'unauthorized'
      };

      return next();
    }

    function validateRunningQuiz() {
        let query = "SELECT * FROM quiz WHERE creator = ? AND is_finished = ?";
        const params = [req.user.user_id, 'incomplete'];

        query = mysql.format(query, params);
        return dbUtils.query(query, []).then(
          getValidationResults
        ).catch(
          (err, message) => {
            res.appData = {
              'status': 'failure',
              'message': err
            };

            return next();
          }
        );
    }

    function getValidationResults(results, fields) {
        if (results.length === 0) {
            return createQuiz();
        } else {
          req.session.game = {
            quiz_id: results[0].quiz_id,
            isMaster: true
          };

          res.appData = {
            'status': 'failure',
            'message': 'quiz is already running'
          };

          return next();
        }
    }

    function createQuiz() {
        const hash = randomstring.generate({
          length: 4,
          charset: 'alphabetic'
        });

        const quizData = {
          question_banks: req.body.questionBanks,
          players: {},
          kickedPlayers: [],
          questions: [],
          alreadyAsked: {}
        };

        let query = "INSERT INTO quiz SET ?";
        const params = {
          'creator': req.user.user_id,
          'quiz_hash': hash,
          'is_finished': 'incomplete',
          'quiz_data': JSON.stringify(quizData)
        };

        query = mysql.format(query, params);
        return dbUtils.query(query, []).then(
          getQuizId
        ).catch(
          (err, message) => {
            res.appData = {
              'status': 'failure',
              'message': err
            };

            return next();
          }
        );
    }

    function getQuizId(results, fields) {
      let quizId = results.insertId;

      let query = "SELECT quiz_id, creation_date, quiz_hash, is_finished as creator_name FROM quiz WHERE quiz_id = ?";
      const params = [quizId];

      query = mysql.format(query, params);
      return dbUtils.query(query, []).then(
        compileData
      ).catch(
        (err, message) => {
          res.appData = {
            'status': 'failure',
            'message': err
          };

          return next();
        }
      );
    }

    function compileData(results, fields) {
      const data = {
        gameTag: results[0].quiz_id + results[0].quiz_hash
      };

      req.session.game = {
        "quiz_id": results[0].quiz_id,
        "isMaster": true
      };

      res.appData = {
        'status': 'success',
        'message': '',
        'data': data
      };

      return next();
    }

};

getQuiz = function(req, res, next) {
  if (req.user) {
    return getQuizData();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  }

  function getQuizData() {
    let query = "SELECT quiz_id, creator as creator_id, creation_date, quiz_hash, is_finished, u.name as creator_name FROM quiz q, users u WHERE q.creator = u.user_id";
    let params = [];
    if (req.user.role !== 'admin') {
      query += " AND creator = ?";
      params.push(req.user.user_id);
    }

    if (req.query.search) {
      query += " AND u.name LIKE ?";
      params.push("%" + req.query.search + "%");

    }

    if (req.query.isFinished) {
      query += " AND q.is_finished = ?";
      params.push(req.query.isFinished === 'true' ? "complete" : "incomplete");
    }

    query += " ORDER BY creation_date DESC";

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      compileData
    ).catch(
      (err, message) => {
        res.appData = {
          'status': 'failure',
          'message': err
        };

        return next();
      }
    );
  }

  function compileData(results, fields) {
    res.appData = {
      'status': 'success',
      'message': '',
      'data': results
    };

    return next();
  }
};

getQuizById = function(req, res, next) {
  if (req.user) {
    return getQuizData();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  }

  function getQuizData() {
    let query = "SELECT quiz_id, creator as creator_id, creation_date, quiz_hash, is_finished, u.name as creator_name FROM quiz q, users u WHERE quiz_id = ?"
    const params = [req.params.quizId];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      compileData
    ).catch(
      (err, message) => {
        res.appData = {
          'status': 'failure',
          'message': err
        };

        return next();
      }
    );

    function compileData(results, fields) {
      if (results.length <= 0) {
        res.appData = {
          'status': 'failure',
          'message': 'no data found'
        };
      } else {
        res.appData = {
          'status': 'success',
          'message': '',
          'data': results[0]
        };
      }

      return next();
    }
  }
};

updateQuiz = function(req, res, next) {
  if (req.user) {
    return updateQuizData();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  }

  function updateQuizData() {
    let query = "UPDATE quiz SET is_finished = ? WHERE quiz_id = ?";
    const params = ['complete', req.params.quizId];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      compileData
    ).catch(
      (err, message) => {
        res.appData = {
          'status': 'failure',
          'message': err
        };

        return next();
      }
    );

    function compileData(results, fields) {
        res.appData = {
          'status': 'success',
          'message': '',
          'data': ''
        };

      return next();
    }
  }
};

router.post('/', startQuiz);
router.get('/', getQuiz);
router.get('/:quizId', getQuizById);
router.patch('/:quizId', updateQuiz);

module.exports = router;