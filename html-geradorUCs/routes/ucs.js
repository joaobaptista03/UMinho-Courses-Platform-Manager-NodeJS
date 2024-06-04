const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('./../aux/auth');

router.post('/', async (req, res) => {
    let { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const newUC = {
        _id: req.body._id,
        titulo: req.body.titulo,
        docentes: req.body.docentes,
        horario: {
            teoricas: req.body.horarioTeoricas.split(';'),
            praticas: req.body.horarioPraticas.split(';')
        },
        avaliacao: req.body.avaliacao.split(';'),
        datas: {
            teste: req.body.dataTeste,
            exame: req.body.dataExame,
            projeto: req.body.dataProjeto
        },
        aulas: [],
        criador: username
    };

    try {
        const response = await axios.post(`${process.env.API_URI}/ucs?token=${req.cookies.token}`, newUC);
        res.redirect(`/ucs/${response.data._id}`);
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao adicionar UC' }, title: 'Erro', isAdmin, username });
    }
});

router.get('/:id', async (req, res) => {
    let { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    try {
        let dados = await axios.get(`${process.env.API_URI}/ucs/${req.params.id}`);
        if (!dados.data) {
            res.render('error', { error: { status: 404, message: 'UC não encontrada' }, title: 'Erro', isAdmin, username });
            return;
        }

        let hadError = false;
        const newDocentes = await Promise.all(dados.data.docentes.map(async (docenteId) => {
            try {
                const docenteData = await axios.get(`${process.env.AUTH_URI}/${docenteId}?token=${req.cookies.token}`);
                return docenteData.data;
            } catch (error) {
                hadError = true;
                return null;
            }
        }));

        if (hadError) {
            res.render('error', { error: { status: 501, message: 'Erro ao consultar Docentes' }, title: 'Erro', isAdmin, username });
            return;
        }

        dados.data.docentes = newDocentes.filter(d => d !== null);

        res.render('uc', { uc: dados.data, title: `UC: ${dados.data.titulo}`, isAdmin, username });
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao consultar UC' }, title: 'Erro', isAdmin, username });
    }
});

router.get('/edit/:id', async (req, res) => {
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
        let ucResponse = await axios.get(`${process.env.API_URI}/ucs/${req.params.id}`);

        if (ucResponse.data.criador !== username && !isAdmin) {
            res.render('error', { error: { status: 401, message: 'Não tem permissões para editar esta UC' }, title: 'Erro', isAdmin, username });
            return;
        }

        const docentesResponse = await axios.get(`${process.env.AUTH_URI}?role=docente&token=${req.cookies.token}`);
        const docentes = docentesResponse.data;

        ucResponse.data.docentes = await Promise.all(ucResponse.data.docentes.map(async (docenteId) => {
            const docenteResponse = await axios.get(`${process.env.AUTH_URI}/${docenteId}?token=${req.cookies.token}`);
            return docenteResponse.data;
        }));

        res.render('editUC', { uc: ucResponse.data, docentes, title: `Editar UC: ${ucResponse.data.titulo}`, isAdmin, username });
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao consultar UC ou Docentes' }, title: 'Erro', isAdmin, username });
    }
});

router.post('/edit/:id', async (req, res) => {
    let { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para aceder a esta página.' }, title: 'Erro', isAdmin, username });
        return;
    }

    const ucResponse = await axios.get(`${process.env.API_URI}/ucs/${req.params.id}`);

    if (ucResponse.data.criador !== username && !isAdmin) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para editar esta UC' }, title: 'Erro', isAdmin, username });
        return;
    }

    try {
        const updatedUC = {
            _id: req.body._id,
            titulo: req.body.titulo,
            docentes: req.body.docentes,
            horario: {
                teoricas: req.body.horarioTeoricas.split(';'),
                praticas: req.body.horarioPraticas.split(';')
            },
            avaliacao: req.body.avaliacao.split(';'),
            datas: {
                teste: req.body.dataTeste,
                exame: req.body.dataExame,
                projeto: req.body.dataProjeto
            },
            aulas: JSON.parse(req.body.aulas)
        };

        await axios.put(`${process.env.API_URI}/ucs/${req.params.id}?token=${req.cookies.token}`, updatedUC);
        res.redirect(`/ucs/${req.params.id}`);
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao editar UC' }, title: 'Erro', isAdmin, username });
    }
});

router.get('/delete/:id', async (req, res) => {
    let { isAdmin, isDocente, username, error } = await auth.verifyToken(req);

    if (error) {
        res.render('login', { title: 'Login', error });
        return;
    }

    if (!isAdmin && !isDocente) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para eliminar esta UC' }, title: 'Erro', isAdmin, username });
        return;
    }

    const ucResponse = await axios.get(`${process.env.API_URI}/ucs/${req.params.id}`);
    if (ucResponse.data.criador !== username && !isAdmin) {
        res.render('error', { error: { status: 401, message: 'Não tem permissões para eliminar esta UC' }, title: 'Erro', isAdmin, username });
        return;
    }

    try {
        await axios.delete(`${process.env.API_URI}/ucs/${req.params.id}?token=${req.cookies.token}`);
        res.redirect('/');
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao eliminar UC' }, title: 'Erro', isAdmin, username });
    }
});

module.exports = router;