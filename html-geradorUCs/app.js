var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
const favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var axios = require('axios');

var indexRouter = require('./routes/index');
var ucRouter = require('./routes/uc');
var addDocenteRouter = require('./routes/addDocente');
var filesRouter = require('./routes/files');

var app = express();

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/uc', ucRouter);
app.use('/addDocente', addDocenteRouter);
app.use('/files', filesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(async function(err, req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined') {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (!userLogged) {
		res.redirect('/login')
		return;
	}
  
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {error: { status: 500, message: err }, title: 'Erro', userLogged, isAdmin, username});
});

module.exports = app;
