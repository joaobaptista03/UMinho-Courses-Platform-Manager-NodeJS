var express = require('express');
var router = express.Router();
var axios = require('axios');
const path = require('path');
const fs = require('fs');
var multer = require('multer');
var upload = multer({ dest: 'uploads' });
var auth = require('./../aux/auth');

router.get('/', async function (req, res, next) {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const relativePath = req.query.path || '';
    const subPath = path.join(__dirname, '/../public/filesUploaded/', username);
    const absolutePath = path.join(subPath, relativePath);

    if (!absolutePath.startsWith(subPath) && !isAdmin) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const folderName = path.basename(absolutePath);

    fs.readdir(absolutePath, { withFileTypes: true }, (err, files) => {
        if (err) {
            res.render('error', { error: { status: 501, message: 'Erro ao listar ficheiros' }, title: 'Erro', isAdmin, username });
            return;
        }

        const fileList = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory()
        }));

        res.render('files', { path: relativePath, files: fileList, title: 'Pasta: ' + folderName, isAdmin, username });
    });
});

router.post('/', upload.single('file'), async function (req, res, next) {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const relativePath = req.body.path || '';
    const absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

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

router.get('/delete', async function (req, res, next) {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const type = req.query.type;
    const relativePath = req.query.path || '';
    const absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

    try {
        if (type === 'file') {
            await fs.promises.unlink(absolutePath);
        } else if (type === 'dir') {
            await fs.promises.rmdir(absolutePath, { recursive: true });
        }
        res.redirect('/files?path=' + path.dirname(relativePath));
    } catch (err) {
        next(err);
    }
});

router.get('/download', async function (req, res, next) {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!username) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const relativePath = req.query.path;
    const absolutePath = path.join(__dirname, '/../public/filesUploaded/', relativePath);

    res.download(absolutePath, err => {
        if (err) {
            next(err);
        }
    });
});

router.post('/files/folder', async function (req, res, next) {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const relativePath = req.body.path || '';
    const absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath, req.body.folderName);

    fs.mkdir(absolutePath, err => {
        if (err) {
            return next(err);
        }

        res.redirect('/files?path=' + relativePath);
    });
});

module.exports = router;
