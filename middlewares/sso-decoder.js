const request = require('request-promise');
require('dotenv').config();

if (
    !process.env.SSO_HOST ||
    !process.env.SSO_CLIENT_ID ||
    !process.env.SSO_CLIENT_SECRET
) {
    throw new Error('Enviroment Variables Not Set.');
}
exports.validate = async (req, res, next) => {
    try {
        const token =
            req.headers['Authorization'] || req.headers['authorization'];
        // console.log(token)
        if (!token || token.length < 2) throw new Error('No token Supplied');
        const decoded = await request.get(
            process.env.SSO_HOST + '/users/profile',
            {
                json: true,
                headers: {
                    authorization: token,
                    client: process.env.SSO_CLIENT_ID,
                    secret: process.env.SSO_CLIENT_SECRET
                }
            }
        );
        // console.log(decoded)
        if (!decoded) {
            throw new Error('UnExpected Error Occured');
        } else if (decoded.err) {
            throw new Error(decoded.msg);
        } else {
            req.user = decoded.user;
            // console.log(decoded.user)
            next();
        }
    } catch (e) {
        res.status(403).json({
            success: false,
            err: true,
            msg: String(e)
        });
    }
};
