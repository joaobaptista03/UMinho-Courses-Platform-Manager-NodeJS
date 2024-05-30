const Docente = require('../models/docente');

module.exports.list = async () => {
    return await Docente
        .find()
        .exec();
}

module.exports.findById = id => {
    return Docente
        .findOne({ _id: id })
        .exec();
}

module.exports.insert = docente => {
    return Docente.create(docente);
}

module.exports.removeById = id => {
    return Docente.deleteOne({ _id: id });
}

module.exports.update = (id, docente) => {
    return Docente.updateOne({ _id: id }, docente);
}