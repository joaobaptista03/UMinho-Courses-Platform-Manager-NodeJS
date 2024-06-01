const mongoose = require('mongoose');

const ucSchema = new mongoose.Schema({
    _id: String,
    titulo: String,
    docentes: [String],
    horario: {
        teoricas: [String],
        praticas: [String]
    },
    avaliacao: [String],
    datas: {
        teste: String,
        exame: String,
        projeto: String
    },
    aulas: [{
        tipo: String,
        data: String,
        sumario: [String],
    }],
    criador: String
}, { versionKey: false });

module.exports = mongoose.model('uc', ucSchema);