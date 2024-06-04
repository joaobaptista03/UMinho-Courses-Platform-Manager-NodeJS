const express = require('express');
const passport = require('passport');
const User = require('../models/user');
const auth = require('../auth/auth');
var jwt = require('jsonwebtoken')

const router = express.Router();

router.get('/', auth.verificaAcesso, function (req, res) {
  if (req.query.role.toLowerCase() === 'admin') {
    User.find({ $or: [{ level: 'Admin' }, { level: 'AdminDocente' }] }).exec()
      .then(dados => {
        dados.forEach(user => {
          user.hash = undefined
          user.salt = undefined
          user.__v = undefined
        })
        res.jsonp(dados)
        return;
      })
      .catch(e => res.status(500).jsonp({ error: e }))
  } else if (req.query.role.toLowerCase() === 'docente') {
    User.find({ $or: [{ level: 'Docente' }, { level: 'AdminDocente' }] }).exec()
      .then(dados => {
        dados.forEach(user => {
          user.hash = undefined
          user.salt = undefined
          user.__v = undefined
        })
        res.jsonp(dados)
        return;
      })
  } else if (req.query.role.toLowerCase() === 'aluno') {
    User.find({ level: 'Aluno' }).exec()
      .then(dados => {
        dados.forEach(user => {
          user.hash = undefined
          user.salt = undefined
          user.__v = undefined
        })
        res.jsonp(dados)
        return;
      })
  } else {
    User.find().exec()
      .then(dados => {
        dados.forEach(user => {
          user.hash = undefined
          user.salt = undefined
          user.__v = undefined
        })
        res.jsonp(dados)
        return;
      })
  }
});

router.post('/', auth.verificaAcesso, function (req, res) {
  var role = req.query.role.toLowerCase();

  if ((role === 'admin' || role === 'docente' || role === 'admindocente') && (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente')) {
    res.status(401).jsonp({ error: "Unauthorized" });
    return;
  }

  var role = req.query.role.charAt(0).toUpperCase() + req.query.role.slice(1);

  if (req.query.role.toLowerCase() === 'admin' && req.body.docente === 'on') {
    role = 'AdminDocente';
  }

  User.register(new User({
    username: req.body.username, name: req.body.name, email: req.body.email, categoria: req.body.categoria, filiacao: req.body.filiacao, webpage: req.body.webpage, level: role, fotoExt: req.body.fotoExt
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
});

router.delete('/', auth.verificaAcesso, function (req, res) {
  if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente') {
    res.status(401).jsonp({ error: "Não autorizado" });
    return;
  }

  User.findOneAndDelete({ username: req.query.username }).exec()
    .then(dados => {
      if (dados) {
        var denominacao = dados.level.charAt(0).toUpperCase() + dados.level.slice(1)
        res.jsonp({ message: denominacao + " apagado com sucesso", fotoExt: dados.fotoExt })
      }
      else
        res.status(404).jsonp({ error: "Utilizador não encontrado" })
    })
    .catch(e => res.status(500).jsonp({ error: e }))
});

router.post('/changePassword', auth.verificaAcesso, function (req, res) {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  if (oldPassword === newPassword) {
    res.jsonp({ error: "A password antiga e a nova não podem ser iguais" });
    return;
  }

  User.findOne({ username: req.payload.username }).exec()
    .then(user => {
      if (!user) {
        res.status(404).jsonp({ error: "User not found" });
        return;
      }

      user.authenticate(oldPassword, function (err, result) {
        if (err) {
          res.status(500).jsonp({ error: err });
        } else if (!result) {
          res.jsonp({ error: "Password Errada" });
        } else {
          user.setPassword(newPassword, function (err) {
            if (err) {
              res.status(500).jsonp({ error: err });
            } else {
              user.save()
                .then(() => res.jsonp({ message: "Password changed successfully" }))
                .catch(e => res.status(500).jsonp({ error: e }));
            }
          });
        }
      });
    })
    .catch(e => {
      res.status(500).jsonp({ error: e });
    });
});

router.post('/login', passport.authenticate('local'), function (req, res) {
  jwt.sign({
    username: req.user.username, level: req.user.level,
    sub: 'Gerador WebSite UCs - EngWeb2024'
  },
    "ProjetoEW2024-a100705-a100896-a100711",
    { expiresIn: 3600 },
    function (e, token) {
      if (e) res.status(500).jsonp({ error: "Erro na geração do token: " + e })
      else {
        res.status(201).jsonp({ token: token })
      }
    });
})

router.get('/verifyToken', auth.verificaAcesso, function (req, res) {
  if (req.tokenExpired || req.tokenError) {
    res.jsonp({
      username: "",
      isAdmin: false,
      isDocente: false,
      isExpired: req.tokenExpired,
      isError: req.tokenError
    })
    return
  }

  res.jsonp({
    isAdmin: (req.payload.level === "Admin" || req.payload.level === "AdminDocente" ? true : false),
    isDocente: (req.payload.level === "Docente" ? true : false),
    username: req.payload.username,
    isExpired: req.tokenExpired,
    isError: req.tokenError
  })
});

router.get('/:username', function (req, res) {
  User.findOne({ username: req.params.username }).exec()
    .then(dados => {
      if (dados) {
        dados.hash = undefined
        dados.salt = undefined
        dados.__v = undefined
        res.jsonp(dados)
      }
      else
        res.status(404).jsonp({ error: "User not found: " + req.params.username })
    })
    .catch(e => res.status(500).jsonp({ error: e }))
});

module.exports = router;