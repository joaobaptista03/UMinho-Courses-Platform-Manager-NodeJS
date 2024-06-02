var express = require('express');
var router = express.Router();
var axios = require('axios');
const path = require('path');
const fs = require('fs');
var multer = require('multer');
var upload = multer({dest : 'uploads'})

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

	if (!userLogged) {
		res.redirect('/login')
		return;
	}
	
    var relativePath = req.query.path || '';
	var subPath = path.join(__dirname, '/../public/filesUploaded/', username);

    var absolutePath = path.join(subPath, relativePath);

	if (!absolutePath.startsWith(subPath)) {
		res.redirect('/files');
		return;
	}

    fs.readdir(absolutePath, { withFileTypes: true }, (err, files) => {
        if (err) {
			res.render('error', { error: { status: 501, message: 'Erro ao listar ficheiros' }, title: 'Erro', userLogged, isAdmin, username});
        }

        var fileList = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory()
        }));

        res.render('files', { path: relativePath, files: fileList, title: 'Ficheiros', userLogged, isAdmin, username });
    })
});

router.get('/download', function (req, res, next) {
    var relativePath = req.query.path;
    var absolutePath = path.join(__dirname, '/../public/filesUploaded/', relativePath);

    res.download(absolutePath, err => {
        if (err) {
            next(err);
        }
    });
});

router.post('/upload', upload.single('file'), async function (req, res, next) {
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

router.post('/createFolder', async function (req, res, next) {
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

	var relativePath = req.body.path || '';
	var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath, req.body.folderName);

	fs.mkdir(absolutePath, err => {
		if (err) {
			return next(err);
		}

		res.redirect('/files?path=' + relativePath);
	});
});

router.get('/delete', async function (req, res, next) {
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

	var type = req.query.type;
	var relativePath = req.query.path || '';
	var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

	console.log(type);
	console.log(absolutePath);

	if (type == 'file') {
		fs.unlink(absolutePath, err => {
			if (err) {
				return next(err);
			}
		});
	} else if (type == 'dir') {
		fs.rmdir(absolutePath, { recursive: true }, err => {
			if (err) {
				return next(err);
			}			
		});
	}

	res.redirect('/files?path=' + path.dirname(relativePath));
});

module.exports = router;
