var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var dbUtils = require('../utilities/dbUtil');

checkSession = function(req) {
  if (!req.session.game) {
    return undefined;
  }

  return req.session.game;
};

getGame = function(req, res, next) {
  const data = checkSession(req);

  if (!data) {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  } else {
    getGame();
  }

  function getGame() {
    let query = "SELECT * FROM quiz WHERE quiz_id = ?";
    const params = [data.quiz_id];

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
    const json = JSON.parse(results[0].quiz_data);

    if (json.isCompleted) {
      req.session.game = undefined;

      res.appData = {
        'status': 'failure',
        'message': '',
        'data': json
      };

      return next();
    }

    let resData = undefined;
    if (data.isMaster) {
      resData = json;
      resData.serverTime = new Date().getTime();
    } else {
      resData = {
        players: json.players,
        kickedPlayers: json.kickedPlayers,
        questions: json.questions,
        currentQuestion: json.current !== undefined ? json.current.question : undefined,
        serverTime: new Date().getTime()
      }
    }

    res.appData = {
      'status': 'success',
      'message': '',
      'data': resData
    };

    return next();
  }
};

postNextQuestion = function(req, res, next) {
  const data = checkSession(req);

  if (!data || !data.isMaster) {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  } else {
    getGame();
  }

  function getGame() {
    let query = "SELECT * FROM quiz WHERE quiz_id = ?";
    const params = [data.quiz_id];

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
    let json = JSON.parse(results[0].quiz_data);

    if (json.isCompleted) {
      req.session.game = undefined;

      res.appData = {
        'status': 'failure',
        'message': 'game already ended',
        'data': json
      };

      return next();
    }

    if (json.alreadyAsked[req.body.questionId]) {
      res.appData = {
        'status': 'failure',
        'message': 'already asked'
      };

      return next();
    }

    let query = "SELECT * FROM banks WHERE question_id = ?";
    const params = [req.body.questionId];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      (r, f) => patchGameData(r, f, json)
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

  function patchGameData(r, f, json) {
    if (r.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'question not found'
      };

      return next();
    }

    if (json.current) {
      json.questions.push(json.current);

      let minTime = new Date().getTime();
      let player = undefined;

      for (let keys of Object.keys(json.current.players)) {
        if (
          minTime > json.current.players[keys].time &&
          json.current.answer === json.current.players[keys].answer
        ) {
          player = keys;
          minTime = json.current.players[keys].time;
        }
      }

      if (player) {
        json.players[player] = json.players[player] + json.current.question.points;
      }
    }

    json.alreadyAsked[r[0].question_id] = 1;

    json.current = {
      question: {
        points: req.body.points,
        quesId: r[0].question_id,
        ques: r[0].question,
        options: [r[0].option_1, r[0].option_2, r[0].option_3, r[0].option_4]
      },
      answer: r[0].answer,
      players: {}
    }

    let query = "UPDATE quiz SET quiz_data = ? WHERE quiz_id = ?";
    const params = [JSON.stringify(json), data.quiz_id];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      (results, fields) => allDone(results, fields, json)
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

  function allDone(results, fields, json) {
    json.serverTime = new Date().getTime();
    res.appData = {
      'status': 'success',
      'message': '',
      'data': json
    };

    return next();
  }
};

postPlayer = function (req, res, next) {
  const data = checkSession(req);

  if (data) {
    let message = undefined;
    if (data.quiz_id) {
      message = 'already registered to another game';
    }

    if (data.isMaster) {
      message = 'also the quiz master';
    }

    if (message) {
      res.appData = {
        'status': 'failure',
        'message': message
      };

      return next();
    }
  } else {
    postPlayer();
  }

  function postPlayer() {
    let query = "SELECT * FROM quiz WHERE CONCAT(quiz_id, quiz_hash) = ? AND is_finished = ?";
    const params = [req.body.gameTag, 'incomplete'];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      getGameData
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

  function getGameData(results, fields) {
    if (results.length <= 0) {
      res.appData = {
        'status': 'failure',
        'message': 'invalid game tag or game not in progress'
      };

      return next();
    }

    let json = JSON.parse(results[0].quiz_data);

    json.players[req.body.teamName] = 0;

    let resJson = {
      players: json.players,
      kickedPlayers: json.kickedPlayers,
      questions: json.questions,
      currentQuestion: json.current !== undefined ? json.current.question : undefined,
      serverTime: new Date().getTime()
    };

    let query = "UPDATE quiz SET quiz_data = ? WHERE quiz_id = ?";
    const params = [JSON.stringify(json), results[0].quiz_id];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      (r, f) => sendPlayerResponse(r, f, results[0].quiz_id, resJson)
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

  function sendPlayerResponse(results, fields, quiz_id, resJson) {
    req.session.game = {
      quiz_id,
      teamName: req.body.teamName,
      offset: new Date().getTime() - req.body.clientTime
    };

    res.appData = {
      'status': 'success',
      'message': '',
      'data': resJson
    };

    return next();
  }
};

getChange = function(req, res, next) {

};

postAnswer = function(req, res, next) {
  const data = checkSession(req);

  if (!data) {
    res.appData = {
      'status': 'failure',
      'message': 'unauthorized'
    };

    return next();
  } else {
    registerAnswer();
  }

  function registerAnswer() {
    let query = "SELECT * FROM quiz WHERE quiz_id = ?";
    const params = [data.quiz_id];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      getGameData
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

  function getGameData(results,  fields) {
    let json = JSON.parse(results[0].quiz_data);

    if (json.isCompleted) {
      req.session.game = undefined;

      res.appData = {
        'status': 'failure',
        'message': 'game already ended',
        'data': json
      };

      return next();
    }

    if (json.current.question.quesId === req.body.quesId) {
      const serverTime = new Date().getTime();
      json.current.players[data.teamName] = {
        answer: req.body.answer,
        time: serverTime
      };

      let query = "UPDATE quiz SET quiz_data = ? WHERE quiz_id = ?";
      const params = [JSON.stringify(json), data.quiz_id];

      query = mysql.format(query, params);
      return dbUtils.query(query, []).then(
        allDone
      ).catch(
        (err, message) => {
          res.appData = {
            'status': 'failure',
            'message': err
          };

          return next();
        }
      );
    } else {
      res.appData = {
        'status': 'failure',
        'message': 'the question does not match the current question'
      };

      return next();
    }
  }

  function allDone(results, fields) {
    res.appData = {
      'status': 'success',
      'message': '',
      'data': ''
    };

    return next();
  }
};

postEndGame = function(req, res, next) {
  const data = checkSession(req);

  if (!data) {
    res.appData = {
      'status': 'failure',
      'message': 'no game in progress'
    };

    return next();
  }

  getGame();

  function getGame() {
    let query = "SELECT * FROM quiz WHERE quiz_id = ?";
    const params = [data.quiz_id];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      getGameData
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

  function getGameData(results, fields) {
    let json = JSON.parse(results[0].quiz_data);
    if (!data.isMaster) {
      json.kickedPlayers.push(data.teamName);
    } else {
      if (json.current) {
        let minTime = new Date().getTime();
        let player = undefined;

        for (let keys of Object.keys(json.current.players)) {
          if (
            minTime > json.current.players[keys].time &&
            json.current.answer === json.current.players[keys].answer
          ) {
            player = keys;
            minTime = json.current.players[keys].time;
          }
        }

        if (player) {
          json.players[player] = json.players[player] + json.current.question.points;
        }
      }

      json.isCompleted = true;
    }

    let query = "UPDATE quiz SET quiz_data = ? WHERE quiz_id = ?";
    const params = [JSON.stringify(json), data.quiz_id];

    query = mysql.format(query, params);
    return dbUtils.query(query, []).then(
      (results, fields) => allDone(results, fields, json)
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

  function allDone(results, fields, json) {
    req.session.game = undefined;

    if (data.isMaster) {
      let query = "UPDATE quiz SET is_finished = ? WHERE quiz_id = ?";
      const params = ['complete', data.quiz_id];

      query = mysql.format(query, params);
      return dbUtils.query(query, []).then(
        (results, fields) => finalAllDone(results, fields, json)
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

    res.appData = {
      'status': 'success',
      'message': '',
      'data': json
    };

    return next();
  }

  function finalAllDone(results, fields, json) {
    res.appData = {
      'status': 'success',
      'message': '',
      'data': json
    };

    return next();
  }
};

router.get('/', getGame);
router.post('/nextQuestion', postNextQuestion);
router.post('/player', postPlayer);
router.post('/answer', postAnswer);
router.post('/endGame', postEndGame);

module.exports = router;