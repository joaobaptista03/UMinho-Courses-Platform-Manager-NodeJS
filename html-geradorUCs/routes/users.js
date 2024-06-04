const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads' });
const auth = require('./../aux/auth');

function handleError(res, error, message = 'Erro inesperado', status = 500, isAdmin, username) {
    res.status(status).render('error', { error: { status, message }, title: 'Erro', isAdmin, username });
}

function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        res.status(500).render('error', { error: { status: 500, message: 'Erro inesperado ao apagar ficheiro.' }, title: 'Erro' });
    });
}

async function verifyUser(req, res, next) {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);
    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }
    req.user = { isAdmin, isDocente, username };
    next();
}

router.get('/', verifyUser, async (req, res) => {
    const { isAdmin, username } = req.user;
    if (!isAdmin) {
        return res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
    }

    const role = req.query.role;
    try {
        const response = await axios.get(`${process.env.AUTH_URI}?role=${role}&token=${req.cookies.token}`);
        const realRole = role.charAt(0).toUpperCase() + role.slice(1) + 's';
        res.render('listUsers', { users: response.data, title: realRole, role, isAdmin, username });
    } catch (e) {
        handleError(res, e, e.response.data.message, 501, isAdmin, username);
    }
});

router.post('/', upload.single('foto'), verifyUser, async (req, res) => {
    const { isAdmin, username } = req.user;
    const role  = req.query.role.toLowerCase();

    if ((role === 'admin' || role === 'docente' || role === 'admindocente') && !isAdmin) {
        if (req.file && req.file.path) deleteFile(req.file.path);
        return res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
    }

    if (req.file.mimetype.split('/')[0] !== 'image') {
        if (req.file && req.file.path) deleteFile(req.file.path);
        return res.render('register', { title: 'Registar', error: 'O ficheiro não é uma imagem.', role, isAdmin, username });
    }

    req.body.fotoExt = req.file.originalname.split('.').pop();
    const oldPath = path.join(__dirname, '/../', req.file.path);
    const newPath = path.join(__dirname, '/../public/images/users/', `${req.body.username}.${req.body.fotoExt}`);

    fs.access(oldPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.render('error', { error: { status: 500, message: 'Uploaded file not found.' }, title: 'Erro', isAdmin, username });
        }

        fs.mkdir(path.join(__dirname, '/../public/images/users/'), { recursive: true }, (err) => {
            if (err) {
                deleteFile(oldPath);
                return handleError(res, err, 'Erro ao criar pasta', 501, isAdmin, username);
            }

            fs.rename(oldPath, newPath, async (err) => {
                if (err) {
                    deleteFile(oldPath);
                    return handleError(res, err, 'Erro inesperado ao criar utilizador.', 501, isAdmin, username);
                }

                try {
                    const response = await axios.post(`${process.env.AUTH_URI}?role=${role}&token=${req.cookies.token}`, req.body);
                    if (response.data.error && response.data.message) {
                        return res.render('register', { title: 'Registar', error: response.data.message, role, isAdmin, username });
                    }

                    if (role === 'admin' || role === 'docente' || role === 'admindocente') {
                        const folderPath = path.join(__dirname, '/../public/filesUploaded/', req.body.username);
                        fs.mkdir(folderPath, { recursive: true }, (err) => {
                            if (err) {
                                deleteFile(newPath);
                                return handleError(res, err, 'Erro ao criar pasta do utilizador.', 501, isAdmin, username);
                            }

                            const title = role.charAt(0).toUpperCase() + role.slice(1);

                            res.render('success', { title: 'Sucesso', sucesso: `${title} registado com sucesso.`, isAdmin, username });
                        });
                    } else {
                        res.render('login', { title: 'Login', register: true })
                    }
                } catch (err) {
                    handleError(res, err, err.message, 501, isAdmin, username);
                }
            });
        });
    });
});


router.get('/delete', verifyUser, async (req, res) => {
    const { isAdmin, username } = req.user;
    if (!isAdmin) {
        return res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
    }

    try {
        const response = await axios.delete(`${process.env.AUTH_URI}?username=${req.query.username}&token=${req.cookies.token}`);
        if (response.data.error) {
            return handleError(res, response.data.error, response.data.error, 501, isAdmin, username);
        }

        const userFolderPath = path.join(__dirname, '/../public/filesUploaded/', req.query.username);
        const userImagePath = path.join(__dirname, '/../public/images/users/', `${req.query.username}.${response.data.fotoExt}`);

        fs.rm(userFolderPath, { recursive: true }, (err) => {
            if (err) {
                return handleError(res, err, 'Erro ao apagar pasta', 501, isAdmin, username);
            }

            fs.unlink(userImagePath, (err) => {
                if (err) {
                    return handleError(res, err, 'Erro ao apagar ficheiro', 501, isAdmin, username);
                }

                axios.get(process.env.API_URI + '/ucs')
                    .then(dados => {
                        dados.data.forEach(uc => {
                            if (uc.docentes.includes(req.query.username)) {
                                uc.docentes = uc.docentes.filter(docente => docente !== req.query.username);
                                axios.put(`${process.env.API_URI}/ucs/${uc._id}`, uc)
                                    .catch(e => {
                                        handleError(res, e, 'Erro inesperado ao remover o docente das UCs', 501, isAdmin, username);
                                    });
                            }
                        });
                        res.render('success', { title: 'Sucesso', sucesso: 'Utilizador apagado com sucesso.', isAdmin, username });
                    })
                    .catch(e => {
                        handleError(res, e, 'Erro inesperado ao remover o docente das UCs', 501, isAdmin, username);
                    });
            });
        });
    } catch (e) {
        handleError(res, e, e.response.data.message, 501, isAdmin, username);
    }
});

router.get('/login', verifyUser, (req, res) => {
    const { username } = req.user;
    if (username) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Login' });
});

router.post('/login', verifyUser, async (req, res) => {
    const { username } = req.user;
    if (username) {
        return res.redirect('/');
    }

    try {
        const response = await axios.post(`${process.env.AUTH_URI}/login`, req.body);
        res.cookie('token', response.data.token);
        res.redirect('/');
    } catch (e) {
        res.render('login', { title: 'Login', error: 'Username ou password errados.' });
    }
});

router.get('/registar', verifyUser, (req, res) => {
    const { isAdmin, username } = req.user;
    const role = req.query.role.toLowerCase();

    if ((role === 'admin' || role === 'docente' || role === 'admindocente') && !isAdmin) {
        return res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
    }

    if (username && !isAdmin) {
        return res.redirect('/');
    }

    res.render('register', { title: 'Registar', role, isAdmin, username });
});

router.post('/logout', verifyUser, (req, res) => {
    const { username } = req.user;
    if (!username) {
        return res.redirect('/');
    }
    res.cookie('token', undefined);
    res.redirect('/');
});

router.post('/changePassword', verifyUser, async (req, res) => {
    const { isAdmin, username } = req.user;
    
    if (!username) {
        return res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro' });
    }

    try {
        const response = await axios.post(`${process.env.AUTH_URI}/changePassword?token=${req.cookies.token}`, req.body);
        if (response.data.error) {
            return handleError(res, response.data.error, response.data.error, 501, isAdmin, username);
        }
        res.render('success', { title: 'Sucesso', sucesso: 'Password alterada com sucesso.', isAdmin , username });
    } catch (e) {
        handleError(res, e, e.response.data.message, 501, isAdmin, username);
    }
});

module.exports = router;
