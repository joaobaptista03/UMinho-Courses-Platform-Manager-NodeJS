const express = require('express');
const router = express.Router();
const auth = require('../auth/auth');
const UC = require('../controllers/uc');
const axios = require('axios');

const handleError = (res, error, message = 'Erro inesperado', status = 500) => {
    res.status(status).jsonp({ error: message, details: error });
};

router.get('/', auth.verificaAcesso, async (req, res) => {
    const username = req.payload.username;

    var user = await axios.get(`${process.env.AUTH_URI}/${username}?token=${req.query.token}`);

    if (user.data.error) {
        return res.status(404).jsonp({ error: "User not found" });
    }
    
    if (user.data.level != 'Admin' && user.data.level != 'AdminDocente' && user.data.level != 'Docente') {
        return UC.list()
            .then(data => res.jsonp(data.filter(uc => user.data.ucs.includes(uc._id))))
            .catch(error => handleError(res, error));
    }

    UC.list()
        .then(data => res.jsonp(data))
        .catch(error => handleError(res, error));
});

router.get('/:id', auth.verificaAcesso, async (req, res) => {
    const username = req.payload.username;

    var user = await axios.get(`${process.env.AUTH_URI}/${username}?token=${req.query.token}`);

    if (user.data.error) {
        return res.status(404).jsonp({ error: "User not found" });
    }

    if (user.data.level != 'Admin' && user.data.level != 'AdminDocente' && user.data.level != 'Docente') {
        return UC.findById(req.params.id)
            .then(data => {
                if (!user.data.ucs.includes(data._id)) {
                    return res.status(403).jsonp({ message: 'Não autorizado' });
                }

                res.jsonp(data);
            })
            .catch(error => handleError(res, error));
    }
    
    UC.findById(req.params.id)
        .then(data => res.jsonp(data))
        .catch(error => handleError(res, error));
});

router.post('/', auth.verificaAcesso, (req, res) => {
    if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente' && req.payload.level !== 'Docente') {
        return res.status(403).jsonp({ message: 'Não autorizado' });
    }

    req.body.ucs = []
    UC.insert(req.body)
        .then(data => res.jsonp(data))
        .catch(error => handleError(res, error));
});

router.put('/:id', auth.verificaAcesso, (req, res) => {
    if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente' && req.payload.level !== 'Docente') {
        return res.status(403).jsonp({ message: 'Não autorizado' });
    }

    if (req.payload.level === 'Docente') {
        UC.findById(req.params.id)
            .then(data => {
                if (data.criador !== req.payload.username) {
                    return res.status(403).jsonp({ message: 'Não autorizado' });
                }

                UC.update(req.params.id, req.body)
                    .then(data => res.jsonp(data))
                    .catch(error => handleError(res, error));
            })
            .catch(error => handleError(res, error));
    } else {
        UC.update(req.params.id, req.body)
            .then(data => res.jsonp(data))
            .catch(error => handleError(res, error));
    }
});

router.delete('/:id', auth.verificaAcesso, (req, res) => {
    if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente' && req.payload.level !== 'Docente') {
        return res.status(403).jsonp({ message: 'Não autorizado' });
    }

    if (req.payload.level === 'Docente') {
        UC.findById(req.params.id)
            .then(data => {
                if (data.criador !== req.payload.username) {
                    return res.status(403).jsonp({ message: 'Não autorizado' });
                }

                UC.removeById(req.params.id)
                    .then(data => res.jsonp(data))
                    .catch(error => handleError(res, error));
            })
            .catch(error => handleError(res, error));
    } else {
        UC.removeById(req.params.id)
            .then(data => res.jsonp(data))
            .catch(error => handleError(res, error));
    }
});

router.get('/exists/:id', (req, res) => {
    UC.findById(req.params.id)
        .then(data => {
            if (data) {
                res.jsonp({ exists: true });
            } else {
                res.jsonp({ error: 'UC não encontrada', exists: false });
            }
        })
        .catch(error => handleError(res, error));
});

module.exports = router;
