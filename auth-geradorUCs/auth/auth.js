const jwt = require('jsonwebtoken');

module.exports.verificaAcesso = function (req, res, next) {
    const secret = process.env.JWT_SECRET || "ProjetoEW2024-a100705-a100896-a100711";
    const myToken = req.query.token || req.body.token || req.headers['authorization'];

    if (!myToken) {
        return res.status(401).jsonp({ error: "Token not provided!" });
    }

    jwt.verify(myToken, secret, (err, payload) => {
        if (err) {
            return res.status(401).jsonp({ error: "Token invalid or expired!" });
        }

        req.payload = payload;
        next();
    });
};
