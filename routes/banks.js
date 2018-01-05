var express = require('express');
var router = express.Router();
var logger = require('../utilities/logger');
var labels = require('../labels/auth');
var dbUtils = require('../utilities/dbUtil');
var mysql = require('mysql');

function addBank(req, res, next) {
  logger.info("Banks Add - start");
  if (req.user) {
    return addNewQuestionBank();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  }

  function addNewQuestionBank() {
    let query = 'INSERT INTO banks(??, ??, ??, ??, ??, ??, ??, ??, ??) SELECT COUNT(1)+1, ?, ?, ?, ?, ?, ?, ?, ?  FROM banks';

    const params =
      [
        "bank_id", "bank_name", "question", "option_1", "option_2", "option_3", "option_4", "answer", "creator",
        req.body.bank_name, req.body.question, req.body.option_1, req.body.option_2,
        req.body.option_3, req.body.option_4, req.body.answer, req.user.user_id
      ];

    dbUtils.query(query, params)
      .then(getBanksResults)
      .catch(function (err, message) {
        logger.info("the error is", err, message);
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getBanksResults(results, fields) {
    logger.info(results);
    req.body.question_id = results.insertId;

    let query = 'SELECT * FROM ?? WHERE ?? = ?';
    const params = ['banks', 'question_id', req.body.question_id];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(getAddedBank)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getAddedBank(results, fields) {
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
      'data': results[0]
    };

    return next();
  }
};

function getBanksAll(req, res, next) {
  logger.info("Banks get_banks_all - start");
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
    let query = 'SELECT bank_id, bank_name, COUNT(question_id) as count FROM banks GROUP BY bank_name, bank_id';

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
    logger.info("Banks get_banks_all_results - start");

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

function updateBankInfo(req, res, next) {
  logger.info("Banks update_bank_specific - start");

  if (req.user) {
    return updateBank();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
  }

  function updateBank() {
    let query = 'UPDATE banks SET ?? = ? WHERE ?? = ?';

    const params =
      ["bank_name",
        req.body.bank_name,
        "bank_id",
        req.params.bank_id
      ];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(updateSpecifiedBank)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function updateSpecifiedBank(results, field) {
    logger.info("Banks update_specified_bank_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'bank not found'
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

function delBankInfo(req, res, next) {
  logger.info("Banks delete_bank_specific - start");
  if (req.user) {
    deleteBank();
  } else {
    res.appData = {
      status: 'failure',
      message: 'unauthorized'
    };
  }

  function deleteBank() {
    let query = 'DELETE FROM ?? WHERE ?? = ?';

    const params = ['banks', 'bank_id', req.params.bank_id];

    query = mysql.format(query, params);
    dbUtils.query(query, [])
      .then(deleteSelectedBanks)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function deleteSelectedBanks(results, field) {
    logger.info("Banks delete_banks_results - start");

    res.appData = {
      'status': 'success',
      'message': 'bank deleted'
    };

    return next();
  }
};

function getBankInfo(req, res, next) {
  logger.info("Banks get_bank_specific - start");
  if (req.user) {
    return getSelectedBank();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
    return next();
  }

  function getSelectedBank() {
    let query = 'SELECT * FROM ?? WHERE ?? = ?';
    const params = ['banks', 'bank_id', req.params.bank_id];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(getSpecifiedBank)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getSpecifiedBank(results, field) {
    logger.info("Banks get_specified_bank_results - start");
    logger.info(results);

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'bank_id not found'
      };

      return next();
    }

    res.appData = {
      'status': 'success',
      'message': 'the question details are as follows:',
      'data': results
    };

    return next();
  }
};

function addQuestion(req, res, next) {
  logger.info("Banks add_question - start");
  if (req.user) {
    return addNewQuestion();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  }

  function addNewQuestion() {
    let query = 'INSERT INTO banks(??, ??, ??, ??, ??, ??, ??, ??, ??) SELECT bank_id, bank_name, ?, ?, ?, ?, ?, ?, ?  FROM banks WHERE bank_id = ?';

    let creator = req.user.user_id;

    const params =
      [
        "bank_id", "bank_name", "question", "option_1", "option_2", "option_3", "option_4", "answer", "creator",
        req.body.question, req.body.option_1, req.body.option_2, req.body.option_3,
        req.body.option_4, req.body.answer, creator, req.params.bank_id
      ];

    dbUtils.query(query, params)
      .then(getResults)
      .catch(function (err, message) {
        logger.info(err, message);
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getResults(results, fields) {

    req.body.question_id = results.insertId;

    let query = 'SELECT * FROM ?? WHERE ?? = ?';
    const params = ['banks', 'question_id', req.body.question_id];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(getAddedQuestion)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getAddedQuestion(results, fields) {
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
  logger.info("Banks get_questions_all - start");
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
    let query = 'SELECT * FROM banks where ?? = ?';
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
    logger.info("Banks get_questions_all_results - start");

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

function getQuestionInfo(req, res, next) {
  logger.info("Banks get_question_specific - start");
  if (req.user) {
    return getSelectedQuestion();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
    return next();
  }

  function getSelectedQuestion() {
    let query = 'SELECT * FROM ?? WHERE ?? = ? && ?? = ?';
    const params = ['banks', 'bank_id', req.params.bank_id, 'question_id', req.params.question_id];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(getSpecifiedQuestion)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function getSpecifiedQuestion(results, field) {
    logger.info("Banks get_specified_question_results - start");
    logger.info(results);

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'question not found'
      };

      return next();
    }

    res.appData = {
      'status': 'success',
      'message': 'the question details are as follows:',
      'data': results
    };

    return next();
  }
};

function delQuestionInfo(req, res, next) {
  logger.info("Banks delete_question_specific - start");
  if (req.user) {
    deleteQuestion();
  } else {
    res.appData = {
      status: 'failure',
      message: 'unauthorized'
    };
  }

  function deleteQuestion() {
    let query = 'DELETE FROM ?? WHERE ?? = ? && ?? = ?';

    const params = ['banks', 'bank_id', req.params.bank_id, 'question_id', req.params.question_id];

    query = mysql.format(query, params);
    dbUtils.query(query, [])
      .then(deleteSelectedQuestion)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function deleteSelectedQuestion(results, field) {
    logger.info("Banks delete_question_results - start");

    res.appData = {
      'status': 'success',
      'message': 'question deleted'
    };

    return next();
  }
};

function updateQuestionInfo(req, res, next) {
  logger.info("Banks update_question_specific - start");

  if (req.user) {
    return updateQuestion();
  } else {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };
  }

  function updateQuestion() {
    let query = 'UPDATE banks SET ?? = ?, ?? = ?, ?? = ?, ?? = ?, ?? = ?, ?? = ? WHERE ?? = ? && ?? = ?';

    const params =
      ["question",
        req.body.question,
        "option_1",
        req.body.option_1,
        "option_2",
        req.body.option_2,
        "option_3",
        req.body.option_3,
        "option_4",
        req.body.option_4,
        "answer",
        req.body.answer,
        "bank_id",
        req.params.bank_id,
        "question_id",
        req.params.question_id
      ];
    query = mysql.format(query, params);

    dbUtils.query(query, [])
      .then(updateSpecifiedQuestion)
      .catch(function (err, message) {
        res.appData = {
          'status': 'failure',
          'message': message
        };
        return next();
      });
  }

  function updateSpecifiedQuestion(results, field) {
    logger.info("Banks update_specified_question_results - start");

    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'bank or question not found'
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


router.post('/', addBank);
router.get('/', getBanksAll);
router.patch('/:bank_id', updateBankInfo);
router.delete('/:bank_id', delBankInfo);
router.get('/:bank_id', getBankInfo);
router.post('/:bank_id/questions', addQuestion);
router.get('/:bank_id/questions', getQuestionsAll);
router.get('/:bank_id/question/:question_id', getQuestionInfo);
router.delete('/:bank_id/question/:question_id', delQuestionInfo);
router.patch('/:bank_id/question/:question_id', updateQuestionInfo);

module.exports = router;