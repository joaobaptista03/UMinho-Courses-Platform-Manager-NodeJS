var express = require('express');
var router = express.Router();
var axios = require('axios');
const path = require('path');
const fs = require('fs');
var multer = require('multer');
const { error } = require('console');
var upload = multer({ dest: 'uploads' })

router.get('/', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	const { titulo, docente } = req.query;

	axios.get(process.env.API_URI + '/ucs')
		.then(async dados => {
			if (dados.data.length == 0) {
				res.render('index', { ucs: [], title: 'Lista de UCs', docente, userLogged, isAdmin, username });
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
							res.render('error', { error: { status: 501, message: 'Erro ao consultar Docente' }, title: 'Erro', userLogged, isAdmin, username})
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

			res.render('index', { ucs: dados.data, title: 'Lista de UCs', docente, userLogged, isAdmin, username });
		})
		.catch(erro => {
			res.render('error', { error: { status: 501, message: 'Erro ao consultar UCs' }, title: 'Erro', userLogged, isAdmin, username });
		})
});

router.get('/addUC', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (!userLogged) {
		res.redirect('/login')
		return;
	}

	axios.get(process.env.API_URI + '/docentes')
		.then((response) => {
			res.render('addUC', { docentes: response.data, title: 'Adicionar UC', userLogged, isAdmin, username });
		})
		.catch((error) => {
			res.render('error', { error: { status: 501, message: 'Erro ao obter docentes' }, title: 'Erro', userLogged, isAdmin, username });
		});
});

router.get('/login', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}
	
	if (userLogged) {
		res.redirect('/')
		return;
	}

	res.render('login', { title: 'Login' });
});

router.post('/login', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}
	
	if (userLogged) {
		res.redirect('/')
		return;
	}

	axios.post(process.env.AUTH_URI + '/login', req.body)
		.then(response => {
			res.cookie('token', response.data.token)
			res.redirect('/')
		})
		.catch(e => {
			res.render('login', { title: 'Login', error: 'Username ou password errados.' });
		})
});

router.get('/signup', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (userLogged) {
		res.redirect('/')
		return;
	}
	
	res.render('signup', { title: 'Registar' });
});

router.get('/addAdmin', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (!isAdmin) {
		res.redirect('/')
		return;
	}
	
	res.render('addAdmin', { title: 'Registar Administrador', userLogged, isAdmin, username });
});

router.post('/signup', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (userLogged) {
		res.redirect('/')
		return;
	}
	
	axios.post(process.env.AUTH_URI + "/register", req.body)
		.then(response => {
			if (response.data.error && response.data.message ) {
				res.render('signup', { title: 'Registar', error: response.data.message });
				return;
			}

			var folderPath = path.join(__dirname, '/../public/filesUploaded/', req.body.username);
			fs.mkdir(folderPath, { recursive: true }, (err) => {
				if (err) {
					res.render('error', { error: { status: 501, message: 'Erro ao criar pasta' }, title: 'Erro' });
				}
			});

			res.render('login', { title: 'Login', register: true })
		})
		.catch(err => {
			res.render('error', { error: { status: 501, message: err.message }, title: 'Erro' });
		})
});

router.post('/signupAdmin', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (!isAdmin) {
		res.redirect('/')
		return;
	}
	
	axios.post(process.env.AUTH_URI + "/registerAdmin", req.body)
		.then(response => {
			if (response.data.error && response.data.message) {
				res.render('addAdmin', { title: 'Registar Administrador', error: response.data.message, userLogged, isAdmin, username});
				return;
			}

			var folderPath = path.join(__dirname, '/../public/filesUploaded/', req.body.username);
			fs.mkdir(folderPath, { recursive: true }, (err) => {
				if (err) {
					res.render('error', { error: { status: 501, message: 'Erro ao criar pasta' }, title: 'Erro' });
				}
			});
			
			res.render('success', { title: 'Sucesso', sucesso: 'Administrador registado com sucesso.', userLogged, isAdmin, username });
		})
		.catch(err => {
			res.render('error', { error: { status: 501, message: err.message }, title: 'Erro' });
		})
});

router.get('/logout', async (req, res) => {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (userLogged) {
		res.cookie('token', undefined)
	}

	res.redirect('/')
})

router.post('/changePassword', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (!userLogged) {
		res.redirect('/login')
		return;
	}

	axios.post(process.env.AUTH_URI + '/changePassword?token=' + req.cookies.token, req.body)
		.then(response => {
			if (response.data.error) {
				res.render('error', { error: { status: 501, message: response.data.error }, title: 'Erro', userLogged, isAdmin, username });
				return;
			}
			res.render('success', { title: 'Sucesso', sucesso: 'Password alterada com sucesso.', userLogged, isAdmin, username });
		})
		.catch(e => {
			res.render('error', { error: { status: 501, message: e.response.data.message }, title: 'Erro', userLogged, isAdmin, username });
		})
});

router.get('/admins', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (!isAdmin) {
		res.redirect('/')
		return;
	}

	axios.get(process.env.AUTH_URI + '/admins?token=' + req.cookies.token)
		.then(response => {
			res.render('admins', { admins: response.data, title: 'Administradores', userLogged, isAdmin, username });
		})
		.catch(e => {
			res.render('error', { error: { status: 501, message: e.response.data.message }, title: 'Erro', userLogged, isAdmin, username });
		})
});

router.get('/admins/delete', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		if (response.data.isExpired || response.data.isError) {
			res.cookie('token', undefined)
			res.render('login', { title: 'Login', error: 'Login Expirado.' });
			return;
		}
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	if (!isAdmin) {
		res.redirect('/')
		return;
	}

	axios.post(process.env.AUTH_URI + '/deleteAdmin?username=' + req.query.username + '&token=' + req.cookies.token)
		.then(response => {
			if (response.data.error) {
				res.render('error', { error: { status: 501, message: response.data.error }, title: 'Erro', userLogged, isAdmin, username });
				return;
			}

			fs.rmdir(path.join(__dirname, '/../public/filesUploaded/', req.query.username), { recursive: true }, (err) => {
				if (err) {
					res.render('error', { error: { status: 501, message: 'Erro ao apagar pasta' }, title: 'Erro', userLogged, isAdmin, username });
				}
				res.render('success', { title: 'Sucesso', sucesso: 'Administrador removido com sucesso.', userLogged, isAdmin, username });
			});
		})
		.catch(e => {
			res.render('error', { error: { status: 501, message: e.response.data.message }, title: 'Erro', userLogged, isAdmin, username });
		})
});

module.exports = router;
