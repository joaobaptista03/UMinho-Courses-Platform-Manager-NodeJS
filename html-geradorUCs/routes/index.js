const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('./../aux/auth');

const handleError = (res, error, message = 'Erro inesperado', status = 500, isAdmin, username) => {
    res.status(status).render('error', { error: { status, message }, title: 'Erro', isAdmin, username });
};

router.get('/', async (req, res) => {
    const { titulo, docente } = req.query;
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    try {
        const ucResponse = await axios.get(`${process.env.API_URI}/ucs`);
        let ucs = ucResponse.data;

        if (titulo) {
            ucs = ucs.filter(uc => uc.titulo.toLowerCase().includes(titulo.toLowerCase()));
        }

        for (const uc of ucs) {
            const newDocentes = [];
            for (const docenteId of uc.docentes) {
                const docenteResponse = await axios.get(`${process.env.AUTH_URI}/${docenteId}`, { params: { token: req.cookies.token } });
                if (docenteResponse.data.error) {
                    return handleError(res, docenteResponse.data.error, 'Erro ao consultar Docente', 501, isAdmin, username);
                }
                newDocentes.push(docenteResponse.data);
            }
            uc.docentes = newDocentes;
        }

        if (docente) {
            ucs = ucs.filter(uc => uc.docentes.some(d => d.name.toLowerCase().includes(docente.toLowerCase())));
        }

        res.render('index', { ucs, title: 'Lista de UCs', docente, isAdmin, isDocente, username, titulo });
    } catch (error) {
        handleError(res, error, 'Erro ao consultar UCs', 501, isAdmin, username);
    }
});

async function fetchDocentes(token) {
    try {
        const response = await axios.get(`${process.env.AUTH_URI}`, { params: { role: 'Docente', token } });
        return response.data;
    } catch (error) {
        throw new Error('Erro ao obter docentes.');
    }
}

router.get('/addUC', async (req, res) => {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 403, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    try {
        const docentes = await fetchDocentes(req.cookies.token);
        res.render('addUC', { docentes, title: 'Adicionar UC', isAdmin, username });
    } catch (error) {
        handleError(res, error, 'Erro ao obter docentes', 501, isAdmin, username);
    }
});

module.exports = router;
