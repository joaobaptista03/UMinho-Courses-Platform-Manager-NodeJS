var express = require('express');
var router = express.Router();
var axios = require('axios');
var multer = require('multer');
var upload = multer({dest : 'uploads'})
var fs = require('fs');

router.get('/', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}
    
    if (!userLogged) {
        res.redirect('/login')
        return;
    }

    res.render('addDocente', { title: 'Adicionar Docente', userLogged, isAdmin, username });
});

router.post('/', upload.single('foto'), async function (req, res, next) {
    var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined' && req.cookies.token != undefined) {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

    if (!userLogged) {
        res.redirect('/login')
        return;
    }

    var docente = {
        _id: req.body._id,
        nome: req.body.nome,
        categoria: req.body.categoria,
        filiacao: req.body.filiacao,
        email: req.body.email,
        webpage: req.body.webpage,
        fotoExt: req.file.mimetype.split('/')[1]
    };

    if (req.file.mimetype.split('/')[0] != 'image') {
        res.render('error', { error: { status: 501, message: 'Formato da foto inválido' }, title: 'Erro', userLogged, isAdmin, username});
        fs.unlink(__dirname + '/../' + req.file.path, (err) => {
            if (err) console.error('Erro a apagar ficheiro: ' + err);
        });
        return;
    }

    fs.mkdir(__dirname + '/../public/images/docentes/', { recursive: true }, (err) => {
        if (err) console.error('Erro a criar diretório: ' + err);
    });

    let oldPath = __dirname + '/../' + req.file.path;
    let newPath = __dirname + '/../public/images/docentes/' + req.body._id + '.' + req.file.mimetype.split('/')[1];

    fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
    });

    axios.post(process.env.API_URI + '/docentes', docente)
        .then((response) => {
            res.redirect('/');
        })
        .catch((error) => {
            res.render('error', { error: { status: 501, message: 'Erro ao adicionar Docente' }, title: 'Erro', userLogged, isAdmin, username});
        });
});

module.exports = router;
