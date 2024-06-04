const axios = require('axios');

async function verifyToken(req) {
    if (req.cookies.token && req.cookies.token !== 'undefined') {
        try {
            const response = await axios.get(`${process.env.AUTH_URI}/verifyToken`, { params: { token: req.cookies.token } });
            if (response.data.isExpired || response.data.isError) {
                req.res.cookie('token', undefined);
                return { error: response.data.isExpired ? 'Sessão expirada.' : 'Erro na sessão.' };
            }
            return response.data;
        } catch (error) {
            return { error: 'Erro ao verificar o token.' };
        }
    }
    return {};
}

module.exports = { verifyToken };
