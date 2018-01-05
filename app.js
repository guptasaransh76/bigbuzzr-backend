var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Promise = require('promise');

var index = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/auth');
var banks = require('./routes/banks');
var quiz = require ('./routes/quiz');
var fs = require('fs');

var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var logger = require('./utilities/logger');

var app = express();

var sessionConfig = require('./config/sessionConfig')();

var restUtil = require('./utilities/restUtil');

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

logger.debug("Overriding 'Express' logger");
app.use(morgan('combined', logger.stream));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(sessionConfig.secret));
app.use(express.static(path.join(__dirname, 'public')));

var sessionStore = new MySQLStore(require('./config/dbConfig')());
sessionConfig.store = sessionStore;
app.use(session(sessionConfig));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

var addSession = function(req, res, next) {
  logger.info("App - middleware session");

  if (req.session.user_id) {
    return getUser();
  } else {
    return addSession(undefined);
  }

  function getUser() {
    var conn = require('./utilities/dbConnection')();

    conn.connect(function (err) {
      if (err) {
        return addSession(undefined);
      }

      const query = 'SELECT * FROM users WHERE user_id = ?';
      const params = [req.session.user_id];

      conn.query(query, params, validate);
    });
  };

  function validate(err, results, fields) {
    if (err) {
      return addSession(undefined);
    }

    if (results <= 0) {
      return addSession(undefined);
    }

    return addSession(results[0]);
  }

  function addSession(user) {
    req.user = user;
    next();
  };
};

app.use(addSession);
app.use('/', index);
app.use('/api/users', users);
app.use('/api/auth', auth);
app.use('/api/banks', banks);
app.use('/api/quiz', quiz);
app.use(restUtil.createResponse);

//app.use('*', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
