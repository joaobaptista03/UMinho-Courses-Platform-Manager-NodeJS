var express = require('express');
var router = express.Router();

var Docente = require('../controllers/docente');

router.get('/', function (req, res, next) {
	Docente.list()
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.get('/:id', function (req, res, next) {
	Docente.findById(req.params.id)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.post('/', function (req, res, next) {
	Docente.insert(req.body)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.put('/:id', function (req, res, next) {
	Docente.update(req.params.id, req.body)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.delete('/:id', function (req, res, next) {
	Docente.removeById(req.params.id)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

module.exports = router;
