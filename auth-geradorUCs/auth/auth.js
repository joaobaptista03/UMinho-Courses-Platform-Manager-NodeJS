const jwt = require('jsonwebtoken');

module.exports.verificaAcesso = function (req, res, next) {
    const secret = process.env.JWT_SECRET || "ProjetoEW2024-a100705-a100896-a100711";
    const myToken = req.query.token || req.body.token || req.headers['authorization'];

    if (!myToken) {
        req.tokenError = true;
    }

    jwt.verify(myToken, secret, (err, payload) => {
        if (err) {
            req.tokenExpired = true;
        }

        req.payload = payload;
        next();
    });
};

module.exports.isAdmin = async function (req, res, next) {
    const secret = process.env.JWT_SECRET || "ProjetoEW2024-a100705-a100896-a100711";
    const myToken = req.query.token || req.body.token || req.headers['authorization'];

    if (!myToken) {
        res.isAdmin = false;
        next();
    }

    jwt.verify(myToken, secret, (err, payload) => {
        if (err || !payload) {
            res.isAdmin = false;
            next();
        } else if (payload.level === "Admin" || payload.level === "AdminDocente") {
            res.isAdmin = true;
            next();
        }
    });
};