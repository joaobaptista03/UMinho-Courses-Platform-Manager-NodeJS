var express = require('express');
var router = express.Router();
var axios = require('axios');
const path = require('path');
const fs = require('fs');
var multer = require('multer');
var upload = multer({dest : 'uploads'})

router.get('/files', function (req, res, next) {
    // TODO AUTH
    var username = '';
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

        res.render('files', { path: relativePath, files: fileList, title: 'Ficheiros' });
    });
});

router.get('/download', function (req, res, next) {
    // TODO AUTH
    var username = '';
    var relativePath = req.query.path;
    var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

    res.download(absolutePath, err => {
        if (err) {
            next(err);
        }
    });
});

router.get('/upload', upload.single('file'), function (req, res, next) {
	// TODO AUTH
	var username = '';
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

router.get('/delete', function (req, res, next) {
	// TODO AUTH
	var username = '';
	var relativePath = req.query.path || '';
	var absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

	fs.unlink(absolutePath, err => {
		if (err) {
			return next(err);
		}

		res.redirect('/files?path=' + path.dirname(relativePath));
	});
});

module.exports = router;
