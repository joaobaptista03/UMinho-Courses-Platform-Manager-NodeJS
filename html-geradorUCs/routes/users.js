const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads' });
const auth = require('./../aux/auth');

const handleError = (res, message = 'Erro inesperado', status = 500, isAdmin, isDocente, username, fotoExt) => {
    res.status(status).render('error', { error: { status, message }, title: 'Erro', isAdmin, isDocente, username, fotoExt });
};

async function verifyUser(req, res, next) {
    let { isAdmin, isDocente, username, fotoExt } = await auth.verifyToken(req);

    req.user = { isAdmin, isDocente, username, fotoExt };
    next();
}

router.get('/', verifyUser, async (req, res) => {
    const role = req.query.role.toLowerCase();
    const { isAdmin, isDocente, username, fotoExt } = req.user;

    if (!isAdmin) {
        return handleError(res, 'Não tem permissões para aceder a esta página.', 403, isAdmin, isDocente, username, fotoExt);
    }

    if (role != 'admin' && role != 'docente') {
        return handleError(res, 'Role inválido.', 400, isAdmin, isDocente, username, fotoExt);
    }

    try {
        const response = await axios.get(`${process.env.AUTH_URI}?role=${role}&token=${req.cookies.token}`);
        const realRole = role.charAt(0).toUpperCase() + role.slice(1) + 's';
        res.render('listUsers', { users: response.data, title: realRole, role, isAdmin, isDocente, username, fotoExt });
    } catch (e) {
        handleError(res, e.response.data.message, 501, isAdmin, isDocente, username, fotoExt);
    }
});

router.post('/', upload.single('foto'), verifyUser, async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt } = req.user;
    const role = req.query.role.toLowerCase();

    if ((role === 'admin' || role === 'docente' || role === 'admindocente') && !isAdmin) {
        if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
        return handleError(res, 'Não tem permissões para aceder a esta página.', 403, isAdmin, isDocente, username, fotoExt);
    }

    if (!req.body.username || !req.body.password || !req.body.password2 || !req.body.name || !req.body.email || !req.body.categoria || !req.body.filiacao) {
        if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
        return res.render('register', { title: 'Registar', error: 'Preencha todos os campos.', role, isAdmin, isDocente, username, fotoExt });
    }

    if (req.body.password !== req.body.password2) {
        if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
        return res.render('register', { title: 'Registar', error: 'As passwords não coincidem.', role, isAdmin, isDocente, username, fotoExt });
    }

    if (req.file.mimetype.split('/')[0] !== 'image') {
        if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
        return res.render('register', { title: 'Registar', error: 'O ficheiro não é uma imagem.', role, isAdmin, isDocente, username, fotoExt });
    }

    req.body.fotoExt = req.file.originalname.split('.').pop();
    const oldPath = path.join(__dirname, '/../', req.file.path);
    const newPath = path.join(__dirname, '/../public/images/users/', `${req.body.username}.${req.body.fotoExt}`);

    fs.access(oldPath, fs.constants.F_OK, (err) => {
        if (err) {
            return handleError(res, 'Uploaded file not found.', 500, isAdmin, isDocente, username, fotoExt);
        }

        fs.mkdir(path.join(__dirname, '/../public/images/users/'), { recursive: true }, (err) => {
            if (err) {
                fs.unlink(oldPath, () => {});
                return handleError(res, 'Erro ao criar pasta', 500, isAdmin, isDocente, username, fotoExt);
            }

            fs.rename(oldPath, newPath, async (err) => {
                if (err) {
                    fs.unlink(oldPath, () => {});
                    return handleError(res, 'Erro inesperado ao criar utilizador.', 500, isAdmin, isDocente, username, fotoExt);
                }

                try {
                    const response = await axios.post(`${process.env.AUTH_URI}?role=${role}&token=${req.cookies.token}`, req.body);
                    if (response.data.error) {
                        return handleError(res, response.data.message, response.status, isAdmin, isDocente, username, fotoExt);
                    }
                    
                    if (role === 'admin' || role === 'docente' || role === 'admindocente') {
                        const folderPath = path.join(__dirname, '/../public/filesUploaded/', req.body.username);
                        fs.mkdir(folderPath, { recursive: true }, (err) => {
                            if (err) {
                                fs.unlink(newPath, () => {});
                                return handleError(res, 'Erro ao criar pasta do utilizador.', 500, isAdmin, isDocente, username, fotoExt);
                            }

                            const title = role.charAt(0).toUpperCase() + role.slice(1);
                            res.render('success', { title: 'Sucesso', sucesso: `${title} registado com sucesso.`, isAdmin, isDocente, username, fotoExt });
                        });
                    } else {
                        res.render('login', { title: 'Login', message: 'Registrado com sucesso! Faça login para continuar.' });
                    }
                } catch (err) {
                    if (err.response && err.response.data.error.name == 'UserExistsError') {
                        fs.unlink(newPath, () => {});
                        return res.render('register', { title: 'Registar', error: 'Utilizador já existe.', role, isAdmin, isDocente, username, fotoExt });
                    }
                    handleError(res, err, 500, isAdmin, isDocente, username, fotoExt);
                }
            });
        });
    });
});

router.get('/delete', verifyUser, async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt } = req.user;
    if (!isAdmin) {
        return handleError(res, 'Não tem permissões para aceder a esta página.', 403, isAdmin, isDocente, username, fotoExt);
    }

    if (!req.query.username) {
        return handleError(res, 'Username inválido.', 400, isAdmin, isDocente, username, fotoExt);
    }

    if (req.query.username === username) {
        return handleError(res, 'Não pode apagar a sua própria conta.', 403, isAdmin, isDocente, username, fotoExt);
    }

    try {
        const response = await axios.delete(`${process.env.AUTH_URI}?username=${req.query.username}&token=${req.cookies.token}`);
        if (response.data.error) {
            return handleError(res, response.data.error, 500, isAdmin, isDocente, username, fotoExt);
        }

        const userFolderPath = path.join(__dirname, '/../public/filesUploaded/', req.query.username);
        
        fs.rm(userFolderPath, { recursive: true }, (err) => {
            if (err) {
                return handleError(res, 'Erro ao apagar pasta', 500, isAdmin, isDocente, username, fotoExt);
            }
            
            const userImagePath = path.join(__dirname, '/../public/images/users/', `${req.query.username}.${response.data.fotoExt}`);
            fs.unlink(userImagePath, (err) => {
                if (err) {
                    return handleError(res, 'Erro ao apagar ficheiro', 500, isAdmin, isDocente, username, fotoExt);
                }

                axios.get(process.env.API_URI + '/ucs')
                    .then(dados => {
                        dados.data.forEach(uc => {
                            if (uc.docentes.includes(req.query.username)) {
                                uc.docentes = uc.docentes.filter(docente => docente !== req.query.username);
                                axios.put(`${process.env.API_URI}/ucs/${uc._id}?token=${req.cookies.token}`, uc)
                                    .catch(e => handleError(res, 'Erro inesperado ao remover o docente das UCs', 500, isAdmin, isDocente, username, fotoExt));
                            }
                        });
                        res.render('success', { title: 'Sucesso', sucesso: 'Utilizador apagado com sucesso.', isAdmin, isDocente, username, fotoExt });
                    })
                    .catch(e => handleError(res, 'Erro inesperado ao remover o docente das UCs', 500, isAdmin, isDocente, username, fotoExt));
            });
        });
    } catch (e) {
        handleError(res, e.response.data.message, 500, isAdmin, isDocente, username, fotoExt);
    }
});

router.get('/login', verifyUser, (req, res) => {
    const { username } = req.user;
    if (username) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
    try {
        const response = await axios.post(`${process.env.AUTH_URI}/login`, req.body);
        res.cookie('token', response.data.token);
        res.redirect('/');
    } catch (e) {
        res.render('login', { title: 'Login', error: 'Username ou password errados.' });
    }
});

router.get('/registar', verifyUser, (req, res) => {
    const { isAdmin, isDocente, username, fotoExt } = req.user;
    const role = req.query.role.toLowerCase();

    if ((role === 'admin' || role === 'docente' || role === 'admindocente') && !isAdmin) {
        return handleError(res, 'Não tem permissões para aceder a esta página.', 403, isAdmin, isDocente, username, fotoExt);
    }

    if (username && !isAdmin) {
        return res.redirect('/');
    }

    res.render('register', { title: 'Registar', role, isAdmin, isDocente, username, fotoExt });
});

router.post('/logout', verifyUser, (req, res) => {
    res.cookie('token', undefined);
    res.redirect('/');
});

router.post('/changePassword', verifyUser, async (req, res) => {
    const { isAdmin, isDocente, username, fotoExt } = req.user;

    if (!username) {
        return handleError(res, 'Não tem permissões para aceder a esta página.', 403, isAdmin, isDocente, username, fotoExt);
    }

    try {
        const response = await axios.post(`${process.env.AUTH_URI}/changePassword?token=${req.cookies.token}`, req.body);
        if (response.data.error) {
            return handleError(res, response.data.error, 500, isAdmin, isDocente, username, fotoExt);
        }

        res.cookie('token', undefined);
        res.render('login', { title: 'Login', message: 'Password alterada com sucesso! Faça login para continuar.' });
    } catch (e) {
        handleError(res, e.response.data.message, 500, isAdmin, isDocente, username, fotoExt);
    }
});

module.exports = router;
