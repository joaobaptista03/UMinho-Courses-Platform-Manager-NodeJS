var jwt = require('jsonwebtoken')

module.exports.verificaAcesso = function (req, res, next) {
    var myToken = req.query.token || req.body.token
    if (myToken) {
        jwt.verify(myToken, "ProjetoEW2024-a100705-a100896-a100711", function (e, payload) {
            if (e) {
                res.status(401).jsonp({ error: e })
            }
            else {
                req.payload = payload;
                next()
            }
        })
    }
    else {
        res.status(401).jsonp({ error: "Token inexistente!" })
    }
}