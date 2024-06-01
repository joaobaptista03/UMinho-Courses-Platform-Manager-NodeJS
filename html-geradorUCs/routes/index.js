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
			res.render('error', { error: { status: 401, message: 'Credenciais inválidas' } });
		});
	*/
});

router.get('/signup', function (req, res, next) {
	res.render('signup');
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
			res.render('error', { error: { status: 501, message: 'Erro ao criar utilizador' } });
		});
	*/
});

router.get('/files', function (req, res, next) {
    // TODO AUTH
    var username = 'jcr';
    var relativePath = req.query.path || '';
    var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

    fs.readdir(absolutePath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return next(err);
        }

        var fileList = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory()
        }));

        res.render('files', { path: relativePath, files: fileList });
    });
});

router.post('/files', function (req, res, next) {
    // TODO AUTH
    var username = 'jcr';
    var relativePath = req.body.path || '';
    var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

    fs.mkdir(absolutePath, { recursive: true }, err => {
        if (err) {
            return next(err);
        }

        res.redirect('/files?path=' + relativePath);
    });
});


router.get('/files/download', function (req, res, next) {
    // TODO AUTH
    var username = 'jcr';
    var relativePath = req.query.path;
    var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

    res.download(absolutePath, err => {
        if (err) {
            next(err);
        }
    });
});

router.post('/files/upload', upload.single('file'), function (req, res, next) {
	// TODO AUTH
	var username = 'jcr';
	var relativePath = req.body.path || '';
	var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

	fs.mkdir(absolutePath, { recursive: true }, err => {
		if (err) {
			return next(err);
		}

		fs.rename(req.file.path, path.join(absolutePath, req.file.originalname), err => {
			if (err) {
				return next(err);
			}

			res.redirect('/files?path=' + relativePath);
		});
	});
});

router.get('/files/delete', function (req, res, next) {
	// TODO AUTH
	var username = 'jcr';
	var relativePath = req.query.path;
	var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

	fs.unlink(absolutePath, err => {
		if (err) {
			return next(err);
		}

		res.redirect('/files?path=' + path.dirname(relativePath));
	});
});

module.exports = router;
