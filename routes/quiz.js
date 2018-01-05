var express = require('express');
var router = express.Router();
var logger = require('../utilities/logger');
var dbUtils = require('../utilities/dbUtil');
var mysql = require('mysql');

function tableDetails(req, res, next) {
  logger.info("Quiz get_all_quiz_details - start");
  if (req.user) {
    return getAllContent();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
    return next();
  }

  function getAllContent() {
    let query = 'SELECT * FROM quiz WHERE ?? = ?';

    dbUtils.query(query, [])
      .then(getResults)
      .catch(function (err, message) {
        logger.info(err);
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getResults(results, field) {
    logger.info("Quiz get_quiz_all_content_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': err
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

function getBanksAll(req, res, next) {
  logger.info("Quiz Populate_Droplist - start");
  if (req.user) {
    return getAllBanks();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
    return next();
  }

  function getAllBanks() {
    let query = 'SELECT DISTINCT bank_name, bank_id FROM banks';

    dbUtils.query(query, [])
      .then(getResults)
      .catch(function (err, message) {
        logger.info(err);
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getResults(results, field) {
    logger.info("Quiz Populate_Droplist_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': err
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

function getQuestionsAll(req, res, next) {
  logger.info("Quiz populate_Droplist_with_questions_all - start");
  if (req.user) {
    return getAllQuestions();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
    return next();
  }

  function getAllQuestions() {
    let query = 'SELECT question, question_id FROM banks where ?? = ?';
    const params = ['bank_id', req.params.bank_id];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(getResults)
      .catch(function (err, message) {
        logger.info(err);
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getResults(results, field) {
    logger.info("Quiz populate_Droplist_with_questions_all_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': err
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




//router.get('/', tableDetails);
router.get('/', getBanksAll);
router.get('/:bank_id/questions', getQuestionsAll);

//router.get('/:bank_id/questions', getQuestionsAll);



module.exports = router;