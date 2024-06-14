const mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    email: String,
    categoria: String,
    filiacao: String,
    webpage: String,
    level: String,
    fotoExt: String,
    ucs: [String]
  });

userSchema.plugin(passportLocalMongoose);

userSchema.addUC = function (uc) {
    this.ucs.push(uc);
}

module.exports = mongoose.model('user', userSchema)