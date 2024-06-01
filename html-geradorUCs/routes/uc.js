var express = require('express');
var router = express.Router();
var axios = require('axios');
var path = require('path');
var fs = require('fs');

router.get('/edit/:id', async function (req, res, next) {
    try {
        let ucResponse = await axios.get(process.env.API_URI + '/ucs/' + req.params.id);
        let docentesResponse = await axios.get(process.env.API_URI + '/docentes');
        let uc = ucResponse.data;
        let docentes = docentesResponse.data;
        
        uc.docentes = await Promise.all(uc.docentes.map(async docenteId => {
            let docenteResponse = await axios.get(process.env.API_URI + '/docentes/' + docenteId);
            return docenteResponse.data;
        }));
        
        res.render('editUC', { uc, docentes, title: 'Editar UC: ' + uc.titulo});
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao consultar UC ou Docentes' }, title: 'Erro' });
    }
});

router.post('/edit/:id', async function (req, res, next) {
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
            aulas: JSON.parse(req.body.aulas)
        };

        await axios.put(process.env.API_URI + '/ucs/' + req.params.id, updatedUC);
        res.redirect('/uc/' + req.params.id);
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao editar UC' }, title: 'Erro' });
    }
});

router.get('/:id', async function (req, res, next) {
    try {        
        let dados = await axios.get(process.env.API_URI + '/ucs/' + req.params.id);
        if (dados.data == null) {
            res.render('error', { error: { status: 404, message: 'UC não encontrada' }, title: 'Erro' });
            return;
        }

        let docentes = dados.data.docentes;
        var newDocentes = [];
        for (var j = 0 ; j < docentes.length ; j++) {
            try {
                let docenteData = await axios.get(process.env.API_URI + '/docentes/' + docentes[j]);
                newDocentes.push(docenteData.data);
            } catch (erro) {
                res.render('error', { error: { status: 501, message: 'Erro ao consultar Docente' }, title: 'Erro' });
                return;
            }
        }
        dados.data.docentes = newDocentes;

        let horarios = {};
        dados.data.horario.teoricas.forEach(teorica => {
            let [dia, horaSala] = teorica.split(' das ');
            let [horario, sala] = horaSala.split(', ');
            horario = horario.replace(/h/g, ':00').replace(/ às /g, '-');
            sala = sala.replace('sala ', '');
            if (!horarios[dia]) horarios[dia] = [];
            horarios[dia].push({ tipo: 'teorica', horario: horario, sala: sala});
        });
        dados.data.horario.praticas.forEach(pratica => {
            let [tp, turno] = pratica.split(': ');
            tp = tp.replace('Turno ', 'TP')
            let [dia, horaSala] = turno.split(' das ');
            let [horario, sala] = horaSala.split(', ');
            horario = horario.replace(/h/g, ':00').replace(/ às /g, '-');
            sala = sala.replace('sala ', '');
            if (!horarios[dia]) horarios[dia] = [];
            horarios[dia].push({ tipo: 'pratica', turno: tp , horario: horario, sala: sala});
        });
        dados.data.horarios = horarios;


        res.render('uc', { uc: dados.data, title: 'UC: ' + dados.data.titulo});
    } catch (erro) {
        res.render('error', { error: { status: 501, message: 'Erro ao consultar UC' }, title: 'Erro' });
    }
});


router.post('/', function (req, res, next) {
    // TODO AUTH

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
		aulas: []
	};


    axios.post(process.env.API_URI + '/ucs', newUC)
        .then((response) => {
            res.redirect('/uc/' + response.data._id);
        })
        .catch((error) => {
            res.render('error', { error: { status: 501, message: 'Erro ao adicionar UC' }, title: 'Erro' });
        });
});

router.delete('/:id', async function (req, res, next) {
	axios.delete(process.env.API_URI + '/ucs/' + req.params.id)
		.then(dados => res.redirect('/'))
		.catch(erro => res.render('error', { error: { status: 501, message: 'Erro ao eliminar UC' }, title: 'Erro' }));
});

module.exports = router;