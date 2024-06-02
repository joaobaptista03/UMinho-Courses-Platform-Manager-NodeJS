const express = require('express');
const passport = require('passport');
const User = require('../models/user');
const auth = require('../auth/auth');
var jwt = require('jsonwebtoken')

const router = express.Router();

router.get('/admins', function (req, res) {
  User.find({ level: 'admin' }).exec()
    .then(dados => res.jsonp(dados))
    .catch(e => res.status(500).jsonp({ error: e }))
});

router.post('/deleteAdmin', auth.verificaAcesso, function (req, res) {
  if (req.payload.level !== 'admin') {
    res.status(401).jsonp({ error: "Unauthorized" });
    return;
  }

  User.findOneAndDelete({ username: req.query.username, level: 'admin' }).exec()
    .then(dados => {
      if (dados)
        res.jsonp({ message: "Admin deleted with success" })
      else
        res.status(404).jsonp({ error: "Admin not found" })
    })
    .catch(e => res.status(500).jsonp({ error: e }))
});

router.post('/changePassword', auth.verificaAcesso, function (req, res) {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  if (oldPassword === newPassword) {
    res.jsonp({ error: "Old password and new password are the same" });
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
          res.jsonp({ error: "Invalid old password" });
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

router.post('/registerAdmin', function (req, res) {
  User.register(new User({
    username: req.body.username, name: req.body.name, email: req.body.email,
    level: 'admin',
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