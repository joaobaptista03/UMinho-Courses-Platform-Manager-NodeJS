const express = require('express');
const passport = require('passport');
const User = require('../models/user');
const auth = require('../auth/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

const handleError = (res, error, message = 'Erro inesperado', status = 500) => {
    res.status(status).jsonp({ error: message, details: error });
};

router.get('/', (req, res) => {
    const role = req.query.role.toLowerCase();

    let query;
    if (role === 'admin') {
        query = { $or: [{ level: 'Admin' }, { level: 'AdminDocente' }] };
    } else if (role === 'docente') {
        query = { $or: [{ level: 'Docente' }, { level: 'AdminDocente' }] };
    } else if (role === 'aluno') {
        query = { level: 'Aluno' };
    } else {
        query = {};
    }

    User.find(query).exec()
        .then(dados => {
            dados.forEach(user => {
                user.hash = undefined;
                user.salt = undefined;
                user.__v = undefined;
            });
            res.jsonp(dados);
        })
        .catch(e => handleError(res, e));
});

router.post('/', auth.verificaAcesso, (req, res) => {
    const role = req.query.role.toLowerCase();

    if ((role === 'admin' || role === 'docente' || role === 'admindocente') && (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente')) {
        return res.status(403).jsonp({ error: "Unauthorized" });
    }

    var newRole = role.charAt(0).toUpperCase() + role.slice(1);
    if (role.toLowerCase() === 'admin' && req.body.docente === 'on') {
        newRole = 'AdminDocente';
    }

    User.register(new User({
        username: req.body.username,
        name: req.body.name,
        email: req.body.email,
        categoria: req.body.categoria,
        filiacao: req.body.filiacao,
        webpage: req.body.webpage,
        level: newRole,
        fotoExt: req.body.fotoExt
    }), req.body.password, (err, user) => {
        if (err) {
            handleError(res, err, "Register error: " + err);
        } else {
            res.jsonp({ message: "User registered with success" });
        }
    });
});

router.delete('/', auth.verificaAcesso, (req, res) => {
    if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente') {
        return res.status(403).jsonp({ error: "Não autorizado" });
    }

    User.findOneAndDelete({ username: req.query.username }).exec()
        .then(dados => {
            if (dados) {
                const denominacao = dados.level.charAt(0).toUpperCase() + dados.level.slice(1);
                res.jsonp({ message: `${denominacao} apagado com sucesso`, fotoExt: dados.fotoExt });
            } else {
                res.status(404).jsonp({ error: "Utilizador não encontrado" });
            }
        })
        .catch(e => handleError(res, e));
});

router.post('/changePassword', auth.verificaAcesso, (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (oldPassword === newPassword) {
        return res.jsonp({ error: "A password antiga e a nova não podem ser iguais" });
    }

    User.findOne({ username: req.payload.username }).exec()
        .then(user => {
            if (!user) {
                return res.status(404).jsonp({ error: "User not found" });
            }

            user.authenticate(oldPassword, (err, result) => {
                if (err) {
                    handleError(res, err);
                } else if (!result) {
                    res.jsonp({ error: "Password Errada" });
                } else {
                    user.setPassword(newPassword, (err) => {
                        if (err) {
                            handleError(res, err);
                        } else {
                            user.save()
                                .then(() => res.jsonp({ message: "Password changed successfully" }))
                                .catch(e => handleError(res, e));
                        }
                    });
                }
            });
        })
        .catch(e => handleError(res, e));
});

router.post('/login', passport.authenticate('local'), (req, res) => {
    jwt.sign({
        username: req.user.username,
        level: req.user.level,
        sub: 'Gerador WebSite UCs - EngWeb2024'
    }, "ProjetoEW2024-a100705-a100896-a100711", { expiresIn: 3600 }, (e, token) => {
        if (e) {
            handleError(res, e, "Erro na geração do token", 500);
        } else {
            res.status(201).jsonp({ token });
        }
    });
});

router.get('/verifyToken', auth.verificaAcesso, (req, res) => {
    if (req.tokenExpired || req.tokenError) {
        res.jsonp({
            username: "",
            isAdmin: false,
            isDocente: false,
            isExpired: req.tokenExpired,
            isError: req.tokenError
        });
    } else {
        res.jsonp({
            isAdmin: req.payload.level === "Admin" || req.payload.level === "AdminDocente",
            isDocente: req.payload.level === "Docente",
            username: req.payload.username,
            isExpired: req.tokenExpired,
            isError: req.tokenError
        });
    }
});

router.get('/:username', (req, res) => {
    User.findOne({ username: req.params.username }).exec()
        .then(dados => {
            if (dados) {
                dados.hash = undefined;
                dados.salt = undefined;
                dados.__v = undefined;
                res.jsonp(dados);
            } else {
                res.status(404).jsonp({ error: `User not found: ${req.params.username}` });
            }
        })
        .catch(e => handleError(res, e));
});

module.exports = router;
