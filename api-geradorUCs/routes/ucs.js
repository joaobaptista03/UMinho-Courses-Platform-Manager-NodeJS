var express = require('express');
var router = express.Router();

var auth = require('../auth/auth');

var UC = require('../controllers/uc');

router.get('/', function (req, res, next) {
	UC.list()
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.get('/:id', function (req, res, next) {
	UC.findById(req.params.id)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.post('/', auth.verificaAcesso, function (req, res, next) {
	if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente' && req.payload.level !== 'Docente') {
		return res.status(401).jsonp({ message: 'Não autorizado' });
	}

	UC.insert(req.body)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.put('/:id', auth.verificaAcesso, function (req, res, next) {
	if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente' && req.payload.level !== 'Docente') {
		return res.status(401).jsonp({ message: 'Não autorizado' });
	}

	if (req.payload.level === 'Docente') {
		UC.findById(req.params.id)
			.then(data => {
				if (data.criador !== req.payload.username) {
					return res.status(401).jsonp({ message: 'Não autorizado' });
				}
			})
			.catch(error => res.status(500).jsonp(error));
	}

	UC.update(req.params.id, req.body)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.delete('/:id', auth.verificaAcesso, function (req, res, next) {
	if (req.payload.level !== 'Admin' && req.payload.level !== 'AdminDocente' && req.payload.level !== 'Docente') {
		return res.status(401).jsonp({ message: 'Não autorizado' });
	}

	if (req.payload.level === 'Docente') {
		UC.findById(req.params.id)
			.then(data => {
				if (data.criador !== req.payload.username) {
					return res.status(401).jsonp({ message: 'Não autorizado' });
				}
			})
			.catch(error => res.status(500).jsonp(error));
	}
	
	UC.removeById(req.params.id)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

module.exports = router;
