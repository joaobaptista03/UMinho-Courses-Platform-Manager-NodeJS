const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const logger = require('morgan');
const User = require('./models/user');
const indexRouter = require('./routes/index');

var app = express();

// Connect to MongoDB
var mongoDB = process.env.MONGODB_URI || "mongodb://mongo:27017/projeto-geradorUCS";
console.log(`Connecting to MongoDB at ${mongoDB}`);
mongoose.connect(mongoDB)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

var db = mongoose.connection;
db.on("error", console.error.bind(console, "Erro de conexão ao MongoDB"));
db.once("open", () => {
  console.log("Conexão ao MongoDB realizada com sucesso");
});

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({ 
  secret: 'secret', 
  resave: false, 
  saveUninitialized: true 
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/', indexRouter);

app.use(async function(err, req, res, next) {
  console.error(err.stack);
});

module.exports = app;