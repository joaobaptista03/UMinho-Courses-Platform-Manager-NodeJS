var express = require('express');
var router = express.Router();
var axios = require('axios');
const path = require('path');
const fs = require('fs');
var multer = require('multer');
var upload = multer({dest : 'uploads'})

router.get('/', function (req, res, next) {
	const { titulo, docente } = req.query;

	axios.get(process.env.API_URI + '/ucs')
		.then(async dados => {
			if (dados.data.length == 0) {
				res.render('error', { error: { status: 404, message: 'Não existem UCs' }, title: 'Erro' });
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
							res.render('error', { error: { status: 501, message: 'Erro ao consultar Docente' }, title: 'Erro' })
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

			res.render('index', { ucs: dados.data, title: 'Lista de UCs', docente });
		})
		.catch(erro => {
			res.render('error', { error: { status: 501, message: 'Erro ao consultar UCs' }, title: 'Erro' })
		})
});

router.get('/addUC', function (req, res, next) {
	axios.get(process.env.API_URI + '/docentes')
		.then((response) => {
			res.render('addUC', { docentes: response.data, title: 'Adicionar UC' });
		})
		.catch((error) => {
			res.render('error', { error: { status: 501, message: 'Erro ao obter docentes' }, title: 'Erro' });
		});
});

router.get('/login', function (req, res, next) {
	res.render('login', { title: 'Login' });
});

router.post('/login', function (req, res, next) {
	res.redirect('/');
	/* TODO AUTH
	const { username, password } = req.body;

	axios.post(process.env.API_URI + '/login', { username, password })
		.then((response) => {
			res.cookie('token', response.data.token);
			res.redirect('/');
		})
		.catch((error) => {
			res.render('error', { error: { status: 401, message: 'Credenciais inválidas' }, title: 'Erro' });
		});
	*/
});

router.get('/signup', function (req, res, next) {
	res.render('signup', { title: 'Registar' });
});

router.post('/signup', function (req, res, next) {
	res.redirect('/');
	/* TODO AUTH
	const { email, username, password } = req.body;

	axios.post(process.env.API_URI + '/signup', { email, username, password })
		.then((response) => {
			res.redirect('/login');
		})
		.catch((error) => {
			res.render('error', { error: { status: 501, message: 'Erro ao criar utilizador' }, title: 'Erro' });
		});
	*/
});

module.exports = router;
