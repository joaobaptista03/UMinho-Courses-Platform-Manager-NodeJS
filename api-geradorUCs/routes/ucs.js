const express = require('express');
const router = express.Router();
const auth = require('../auth/auth');
const UC = require('../controllers/uc');

const handleError = (res, error, message = 'Erro inesperado', status = 500) => {
    res.status(status).jsonp({ error: message, details: error });
};

router.get('/', (req, res) => {
    UC.list()
        .then(data => res.jsonp(data))
        .catch(error => handleError(res, error));
});

router.get('/:id', (req, res) => {
    UC.findById(req.params.id)
        .then(data => res.jsonp(data))
        .catch(error => handleError(res, error));
});

router.post('/', auth.verificaAcesso, (req, res) => {
    if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente' && req.payload.level !== 'Docente') {
        return res.status(403).jsonp({ message: 'Não autorizado' });
    }

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

module.exports = router;
