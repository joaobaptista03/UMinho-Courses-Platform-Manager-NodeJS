const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads' });
const auth = require('./../aux/auth');

const handleError = (res, error, message = 'Erro inesperado', status = 500, isAdmin, username, fotoExt) => {
    res.status(status).render('error', { error: { status, message }, title: 'Erro', isAdmin, username, fotoExt});
};

router.get('/', async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 403, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username, fotoExt });
        return;
    }

    const relativePath = req.query.path || '';
    const subPath = path.join(__dirname, '/../public/filesUploaded/');
    const subPathWithUsername = path.join(subPath, username);
    const absolutePath = path.join(subPathWithUsername, relativePath);

    if (!absolutePath.startsWith(subPath) || (!absolutePath.startsWith(subPathWithUsername) && !isAdmin)) {
        res.render('error', { error: { status: 403, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username, fotoExt });
        return;
    }

    const folderName = path.basename(absolutePath);

    fs.readdir(absolutePath, { withFileTypes: true }, (err, files) => {
        if (err) {
            handleError(res, err, 'Erro ao listar ficheiros', 500, isAdmin, username, fotoExt);
            return;
        }

        const fileList = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory()
        }));

        res.render('files', { path: relativePath, files: fileList, title: 'Pasta: ' + folderName, isAdmin, username, fotoExt });
    });
});

router.post('/', upload.single('file'), async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 403, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username, fotoExt });
        return;
    }

    const relativePath = req.body.path || '';
    const absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath);

    fs.mkdir(absolutePath, { recursive: true }, err => {
        if (err) {
            handleError(res, err, 'Erro ao criar pasta', 500, isAdmin, username, fotoExt);
            return;
        }

        fs.rename(req.file.path, path.join(absolutePath, req.file.originalname), err => {
            if (err) {
                handleError(res, err, 'Erro ao mover ficheiro', 500, isAdmin, username, fotoExt);
                return;
            }

            res.redirect('/files?path=' + relativePath);
        });
    });
});

router.get('/delete', async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 403, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username, fotoExt });
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
        handleError(res, err, 'Erro ao eliminar', 500, isAdmin, username, fotoExt);
    }
});

router.get('/download', async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    const relativePath = req.query.path;
    const absolutePath = path.join(__dirname, '/../public/filesUploaded/', relativePath);

    res.download(absolutePath, err => {
        if (err) {
            handleError(res, err, 'Erro ao baixar o ficheiro', 500, isAdmin, username, fotoExt);
        }
    });
});

router.post('/folder', async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 403, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username, fotoExt });
        return;
    }

    const relativePath = req.body.path || '';
    const absolutePath = path.join(__dirname, '/../public/filesUploaded/', username, relativePath, req.body.folderName);

    fs.mkdir(absolutePath, err => {
        if (err) {
            handleError(res, err, 'Erro ao criar pasta', 500, isAdmin, username, fotoExt);
            return;
        }

        res.redirect('/files?path=' + relativePath);
    });
});

module.exports = router;
