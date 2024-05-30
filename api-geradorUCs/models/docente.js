const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
    _id: String,
    nome: String,
    categoria: String,
    filiacao: String,
    email: String,
    webpage: String,
    fotoExt: String
}, { versionKey: false });

module.exports = mongoose.model('docentes', docenteSchema);