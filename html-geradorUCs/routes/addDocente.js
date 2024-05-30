var express = require('express');
var router = express.Router();
var axios = require('axios');
var multer = require('multer');
var upload = multer({dest : 'uploads'})
var fs = require('fs');

router.get('/', function (req, res, next) {
    // TODO AUTH
    res.render('addDocente');
});

router.post('/', upload.single('foto'), function (req, res, next) {
    // TODO AUTH

    var docente = {
        _id: req.body._id,
        nome: req.body.nome,
        categoria: req.body.categoria,
        filiacao: req.body.filiacao,
        email: req.body.email,
        webpage: req.body.webpage,
        fotoExt: req.file.mimetype.split('/')[1]
    };

    console.log(docente);

    if (req.file.mimetype.split('/')[0] != 'image') {
        res.render('error', { error: { status: 501, message: 'Formato da foto inválido' } });
        fs.unlink(__dirname + '/../' + req.file.path, (err) => {
            if (err) console.error('Erro a apagar ficheiro: ' + err);
        });
        return;
    }

    fs.mkdir(__dirname + '/../public/images/docentes/', { recursive: true }, (err) => {
        if (err) console.error('Erro a criar diretório: ' + err);
    });

    let oldPath = __dirname + '/../' + req.file.path;
    let newPath = __dirname + '/../public/images/docentes/' + req.body._id + '.' + req.file.mimetype.split('/')[1];

    fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
    });

    axios.post('http://localhost:3000/docentes', docente)
        .then((response) => {
            res.redirect('/');
        })
        .catch((error) => {
            res.render('error', { error: { status: 501, message: 'Erro ao adicionar Docente' } });
        });
});

module.exports = router;
