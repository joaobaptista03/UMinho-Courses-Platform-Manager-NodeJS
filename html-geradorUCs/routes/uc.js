var express = require('express');
var router = express.Router();
var axios = require('axios');
var path = require('path');
var fs = require('fs');

router.get('/edit/:id', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined') {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

    if (!userLogged) {
        res.redirect('/login')
        return;
    }

    try {
        let ucResponse = await axios.get(process.env.API_URI + '/ucs/' + req.params.id);

		if (ucResponse.data.criador != username && !isAdmin) {
			res.render('error', { error: { status: 401, message: 'Não tem permissões para editar esta UC' }, title: 'Erro', userLogged, isAdmin, username});
			return;
		}

        let docentesResponse = await axios.get(process.env.API_URI + '/docentes');
        let uc = ucResponse.data;
        let docentes = docentesResponse.data;
        
        uc.docentes = await Promise.all(uc.docentes.map(async docenteId => {
            let docenteResponse = await axios.get(process.env.API_URI + '/docentes/' + docenteId);
            return docenteResponse.data;
        }));
        
        res.render('editUC', { uc, docentes, title: 'Editar UC: ' + uc.titulo, userLogged, isAdmin, username });
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao consultar UC ou Docentes' }, title: 'Erro', userLogged, isAdmin, username});
    }
});

router.post('/edit/:id', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined') {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

    if (!userLogged) {
        res.redirect('/login')
        return;
    }

	var ucResponse = await axios.get(process.env.API_URI + '/ucs/' + req.params.id);
	if (ucResponse.data.criador != username && !isAdmin) {
		res.render('error', { error: { status: 401, message: 'Não tem permissões para editar esta UC' }, title: 'Erro', userLogged, isAdmin, username});
		return;
	}

    try {
        var updatedUC = {
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
            aulas: JSON.parse(req.body.aulas),
			criador: username
        };

        await axios.put(process.env.API_URI + '/ucs/' + req.params.id, updatedUC);
        res.redirect('/uc/' + req.params.id);
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao editar UC' }, title: 'Erro', userLogged, isAdmin, username});
    }
});

router.get('/:id', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined') {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	try {		
		let dados = await axios.get(process.env.API_URI + '/ucs/' + req.params.id);
		if (dados.data == null) {
			res.render('error', { error: { status: 404, message: 'UC não encontrada' }, title: 'Erro', userLogged, isAdmin, username});
			return;
		}

		let docentes = dados.data.docentes;
		var newDocentes = [];
		for (var j = 0 ; j < docentes.length ; j++) {
			try {
				let docenteData = await axios.get(process.env.API_URI + '/docentes/' + docentes[j]);
				newDocentes.push(docenteData.data);
			} catch (erro) {
				res.render('error', { error: { status: 501, message: 'Erro ao consultar Docente' }, title: 'Erro', userLogged, isAdmin, username});
				return;
			}
		}
		dados.data.docentes = newDocentes;
		
		res.render('uc', { uc: dados.data, title: 'UC: ' + dados.data.titulo, userLogged, isAdmin, username });
	} catch (erro) {
		res.render('error', { error: { status: 501, message: 'Erro ao consultar UC' }, title: 'Erro', userLogged, isAdmin, username});
	}
});

router.post('/', async function (req, res, next) {
    var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined') {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}
    
    if (!userLogged) {
        res.redirect('/login')
        return;
    }

	var newUC = {
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


    axios.post(process.env.API_URI + '/ucs', newUC)
        .then((response) => {
            res.redirect('/uc/' + response.data._id);
        })
        .catch((error) => {
            res.render('error', { error: { status: 501, message: 'Erro ao adicionar UC' }, title: 'Erro', userLogged, isAdmin, username});
        });
});

router.get('/delete/:id', async function (req, res, next) {
	var userLogged = false;
	var isAdmin = false;
	var username = "";

	if (req.cookies.token != 'undefined') {
		const response = await axios.get(process.env.AUTH_URI + '/isLogged?token=' + req.cookies.token)
		userLogged = response.data.isLogged;
		isAdmin = response.data.isAdmin;
		username = response.data.username;
	}

	var ucResponse = await axios.get(process.env.API_URI + '/ucs/' + req.params.id);
	if (ucResponse.data.criador != username && !isAdmin) {
		res.render('error', { error: { status: 401, message: 'Não tem permissões para eliminar esta UC' }, title: 'Erro', userLogged, isAdmin, username});
		return;
	}

    if (!userLogged) {
        res.redirect('/login')
        return;
    }

	axios.delete(process.env.API_URI + '/ucs/' + req.params.id)
		.then(dados => res.redirect('/'))
		.catch(erro => res.render('error', { error: { status: 501, message: 'Erro ao eliminar UC' }, title: 'Erro', userLogged, isAdmin, username}));
});

module.exports = router;