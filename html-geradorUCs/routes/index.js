const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('./../aux/auth');

const handleError = (res, error, message = 'Erro inesperado', status = 500, isAdmin, username) => {
    console.error(error);
    res.status(status).render('error', { error: { status, message }, title: 'Erro', isAdmin, username });
};

const fetchDocente = async (docenteId, token) => {
    try {
        const response = await axios.get(`${process.env.AUTH_URI}/${docenteId}`, { params: { token } });
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        throw new Error('Erro ao consultar Docente');
    }
};

const fetchDocentesForUc = async (uc, token) => {
    const docentePromises = uc.docentes.map(docenteId => fetchDocente(docenteId, token));
    return Promise.all(docentePromises);
};

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

router.get('/', async (req, res) => {
    const { titulo, docente } = req.query;
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        return res.render('login', { title: 'Login', error });
    }

    try {
        const ucResponse = await axios.get(`${process.env.API_URI}/ucs`);
        let ucs = ucResponse.data;

        if (titulo) {
            const normalizedTitulo = removeAccents(titulo);
            ucs = ucs.filter(uc => removeAccents(uc.titulo).includes(normalizedTitulo));
        }

        for (const uc of ucs) {
            try {
                uc.docentes = await fetchDocentesForUc(uc, req.cookies.token);
            } catch (error) {
                return handleError(res, error, 'Erro ao consultar Docente', 501, isAdmin, username);
            }
        }

        if (docente) {
            const normalizedDocente = removeAccents(docente);
            ucs = ucs.filter(uc => uc.docentes.some(d => removeAccents(d.name).includes(normalizedDocente)));
        }

        res.render('index', { ucs, title: 'Lista de UCs', docente, isAdmin, isDocente, username, titulo });
    } catch (error) {
        handleError(res, error, 'Erro ao consultar UCs', 501, isAdmin, username);
    }
});

const fetchDocentes = async (token) => {
    try {
        const response = await axios.get(`${process.env.AUTH_URI}`, { params: { role: 'Docente', token } });
        return response.data;
    } catch (error) {
        throw new Error('Erro ao obter docentes');
    }
};

router.get('/addUC', async (req, res) => {
    const { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        return res.render('login', { title: 'Login', error });
    }

    if (!isAdmin && !isDocente) {
        return res.render('error', { error: { status: 403, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
    }

    try {
        const docentes = await fetchDocentes(req.cookies.token);
        res.render('addUC', { docentes, title: 'Adicionar UC', isAdmin, username });
    } catch (error) {
        handleError(res, error, 'Erro ao obter docentes', 501, isAdmin, username);
    }
});

module.exports = router;
