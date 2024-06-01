const jwt = require('jsonwebtoken');

module.exports.verificaAcesso = function (req, res, next) {
    const secret = process.env.JWT_SECRET || "ProjetoEW2024-a100705-a100896-a100711";
    const myToken = req.query.token || req.body.token || req.headers['authorization'];

    if (myToken) {
        jwt.verify(myToken, secret, (err, payload) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    req.payload = payload;
                    req.tokenExpired = true;
                    req.tokenError = false;
                    next();
                } else if (err.name === 'JsonWebTokenError') {
                    req.payload = payload;
                    req.tokenExpired = false;
                    req.tokenError = true;
                    next();
                } else {
                    req.payload = payload;
                    req.tokenExpired = false;
                    req.tokenError = true;
                    next();
                }
            } else {
                req.payload = payload;
                req.tokenExpired = false;
                req.tokenError = false;
                next();
            }
        });
    } else {
        return res.status(401).jsonp({ error: "Token not provided!" });
    }
};
