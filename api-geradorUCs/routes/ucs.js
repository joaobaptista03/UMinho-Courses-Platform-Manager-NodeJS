var express = require('express');
var router = express.Router();

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

router.post('/', function (req, res, next) {
	UC.insert(req.body)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.put('/:id', function (req, res, next) {
	UC.update(req.params.id, req.body)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

router.delete('/:id', function (req, res, next) {
	UC.removeById(req.params.id)
		.then(data => res.jsonp(data))
		.catch(error => res.status(500).jsonp(error));
});

module.exports = router;
