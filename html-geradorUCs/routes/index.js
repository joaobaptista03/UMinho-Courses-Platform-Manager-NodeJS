var express = require('express');
var router = express.Router();
var axios = require('axios');
const auth = require('./../aux/auth');

router.get('/', async function (req, res, next) {
    const { titulo, docente } = req.query;
    let { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    try {
        const ucResponse = await axios.get(`${process.env.API_URI}/ucs`);
        let ucs = ucResponse.data;

        if (ucs.length === 0) {
            res.render('index', { ucs: [], title: 'Lista de UCs', docente, isAdmin, isDocente, username });
            return;
        }

        if (titulo) {
            ucs = ucs.filter(uc => uc.titulo.toLowerCase().includes(titulo.toLowerCase()));
        }

        for (const uc of ucs) {
            const newDocentes = [];
            for (const docenteId of uc.docentes) {
                try {
                    const docenteResponse = await axios.get(`${process.env.AUTH_URI}/${docenteId}`, { params: { token: req.cookies.token } });
                    if (docenteResponse.data.error) {
                        throw new Error('Erro ao consultar Docente');
                    }
                    newDocentes.push(docenteResponse.data);
                } catch (error) {
                    res.render('error', { error: { status: 501, message: 'Erro ao consultar Docente' }, title: 'Erro', isAdmin, username });
                    return;
                }
            }
            uc.docentes = newDocentes;
        }

        if (docente) {
            ucs = ucs.filter(uc => uc.docentes.some(d => d.name.toLowerCase().includes(docente.toLowerCase())));
        }

        res.render('index', { ucs, title: 'Lista de UCs', docente, isAdmin, isDocente, username, titulo });
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao consultar UCs' }, title: 'Erro', isAdmin, username });
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

router.get('/addUC', async function (req, res, next) {
    let { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    try {
        const docentes = await fetchDocentes(req.cookies.token);
        res.render('addUC', { docentes, title: 'Adicionar UC', isAdmin, username });
    } catch (error) {
        res.render('error', { error: { status: 501, message: error.message }, title: 'Erro', isAdmin, username });
    }
});

module.exports = router;
