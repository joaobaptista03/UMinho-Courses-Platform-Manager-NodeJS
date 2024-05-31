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
        
        res.render('editUC', { uc, docentes });
    } catch (error) {
        res.render('error', { error: { status: 501, message: 'Erro ao consultar UC ou Docentes' } });
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
        res.render('error', { error: { status: 501, message: 'Erro ao editar UC' } });
    }
});

router.get('/:id', async function (req, res, next) {
	try {		
		let dados = await axios.get(process.env.API_URI + '/ucs/' + req.params.id);
		if (dados.data == null) {
			res.render('error', { error: { status: 404, message: 'UC não encontrada' } });
			return;
		}

		let docentes = dados.data.docentes;
		var newDocentes = [];
		for (var j = 0 ; j < docentes.length ; j++) {
			try {
				let docenteData = await axios.get(process.env.API_URI + '/docentes/' + docentes[j]);
				newDocentes.push(docenteData.data);
			} catch (erro) {
				res.render('error', { error: { status: 501, message: 'Erro ao consultar Docente' } });
				return;
			}
		}
		dados.data.docentes = newDocentes;
		
		res.render('uc', { uc: dados.data });
	} catch (erro) {
		res.render('error', { error: { status: 501, message: 'Erro ao consultar UC' } });
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
            res.render('error', { error: { status: 501, message: 'Erro ao adicionar UC' } });
        });
});

router.delete('/:id', async function (req, res, next) {
	axios.delete(process.env.API_URI + '/ucs/' + req.params.id)
		.then(dados => res.redirect('/'))
		.catch(erro => res.render('error', { error: { status: 501, message: 'Erro ao eliminar UC' } }));
});

module.exports = router;