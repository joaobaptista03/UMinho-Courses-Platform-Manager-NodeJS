var express = require('express');
var router = express.Router();
var axios = require('axios');

router.get('/', function (req, res, next) {
	const { titulo, docente } = req.query;

	axios.get(process.env.API_URI + '/ucs')
		.then(async dados => {
			if (dados.data.length == 0) {
				res.render('error', { error: { status: 404, message: 'Não existem UCs' } });
				return;
			}

			if (titulo) {
				dados.data = dados.data.filter(uc => uc.titulo.toLowerCase().includes(titulo.toLowerCase()));
			}

			for (var i = 0; i < dados.data.length; i++) {
				let docentes = dados.data[i].docentes;

				var newDocentes = [];

				for (var j = 0; j < docentes.length; j++) {
					await axios.get(process.env.API_URI + '/docentes/' + docentes[j])
						.then(dados => {
							newDocentes.push(dados.data);
						})
						.catch(erro => {
							res.render('error', { error: { status: 501, message: 'Erro ao consultar Docente' } })
						})
				}

				dados.data[i].docentes = newDocentes;
			}

			if (docente) {
				for (let i = 0; i < dados.data.length; i++) {
					let docentes = dados.data[i].docentes;
					let found = false;
					for (let j = 0; j < docentes.length; j++) {
						if (docentes[j].nome.toLowerCase().includes(docente.toLowerCase())) {
							found = true;
							break;
						}
					}
					if (!found) {
						dados.data.splice(i, 1);
						i--;
					}
				}
			}

			res.render('index', { ucs: dados.data, titulo, docente });
		})
		.catch(erro => {
			res.render('error', { error: { status: 501, message: 'Erro ao consultar UCs' } })
		})
});

router.get('/addUC', function (req, res, next) {
	axios.get(process.env.API_URI + '/docentes')
		.then((response) => {
			res.render('addUC', { docentes: response.data });
		})
		.catch((error) => {
			res.render('error', { error: { status: 501, message: 'Erro ao obter docentes' } });
		});
});

router.get('/login', function (req, res, next) {
	res.render('login');
});

router.get('/signUp', function (req, res, next) {
	res.render('signUp');
});

module.exports = router;
