var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
const favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');

var indexRouter = require('./routes/index');
var ucsRouter = require('./routes/ucs');
var usersRouter = require('./routes/users');
var filesRouter = require('./routes/files');
const auth = require('./aux/auth'); 

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
app.use('/ucs', ucsRouter);
app.use('/files', filesRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(async function(err, req, res, next) {
    let { isAdmin, isDocente, username, fotoExt } = await auth.verifyToken(req);

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', { error: { status: 500, message: err.message }, title: 'Erro', isAdmin, isDocente, username, fotoExt });
});

module.exports = app;