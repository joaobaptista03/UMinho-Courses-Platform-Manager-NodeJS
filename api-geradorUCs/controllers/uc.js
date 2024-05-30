const UC = require('../models/uc');

module.exports.list = async () => {
    return await UC
        .find()
        .exec();
}

module.exports.findById = id => {
    return UC
        .findOne({ _id: id })
        .exec();
}

module.exports.insert = uc => {
    return UC.create(uc);
}

module.exports.removeById = id => {
    return UC.deleteOne({ _id: id });
}

module.exports.update = (id, uc) => {
    return UC.updateOne({ _id: id }, uc);
}