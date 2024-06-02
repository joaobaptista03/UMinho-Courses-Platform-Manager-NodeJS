const express = require('express');
const passport = require('passport');
const User = require('../models/user');
const auth = require('../auth/auth');
var jwt = require('jsonwebtoken')

const router = express.Router();

function updateLastAccess(id, d) {
  return User.updateOne({ username: id }, { lastAccess: d })
    .then(resposta => {
      return resposta
    })
    .catch(erro => {
      return erro
    })
}

router.post('/register', function (req, res) {
  User.register(new User({
    username: req.body.username, name: req.body.name, email: req.body.email,
    level: 'Consumer',
  }),
    req.body.password,
    function (err, user) {
      if (err)
        res.jsonp({ error: err, message: "Register error: " + err })
      else {
        res.jsonp({ message: "User registered with success" })
      }
    }
  )
})

router.post('/login', passport.authenticate('local'), function (req, res) {
  var d = new Date().toISOString().substring(0, 19);

  jwt.sign({
    username: req.user.username, level: req.user.level,
    sub: 'Gerador WebSite UCs - EngWeb2024'
  },
    "ProjetoEW2024-a100705-a100896-a100711",
    { expiresIn: 3600 },
    function (e, token) {
      if (e) res.status(500).jsonp({ error: "Erro na geração do token: " + e })
      else {
        updateLastAccess(req.user.username, d)
          .then(dados => {
            res.status(201).jsonp({ token: token })
          })
          .catch((e) => {
            res.status(508).jsonp({ error: "Erro a atualizar último acesso do utilizador: " + e })
          })
      }
    });
})

router.get('/isLogged', auth.verificaAcesso, function (req, res) {
  if (req.tokenExpired || req.tokenError) {
    res.jsonp({
      isAdmin: false,
      username: "",
      isLogged: false,
      isExpired: req.tokenExpired,
      isError: req.tokenError
    })
    return
  }
  
  res.jsonp({
    isAdmin: (req.payload.level === "admin" ? true : false),
    username: req.payload.username,
    isLogged: true,
    isExpired: req.tokenExpired,
    isError: req.tokenError
  })
})

module.exports = router;