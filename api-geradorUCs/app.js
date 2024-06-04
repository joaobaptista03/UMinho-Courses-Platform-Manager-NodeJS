var express = require('express');
var path = require('path');
var logger = require('morgan');

var ucsRouter = require('./routes/ucs');

var app = express();

var mongoose = require("mongoose");

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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/ucs', ucsRouter);

module.exports = app;
