const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateAccessToken = (user, expiresIn) => {
    // const secret = process.env.JWT_SECRET;
    // console.log("secret", process.env.JWT_SECRET)
    console.log(user);
    const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: expiresIn
    });
    return token;
};

const getToken = (req) => {
    try {
        const tokenString = (
            req.query.token ||
            req.headers['Authorization'] ||
            req.headers['authorization'] ||
            req.cookies.token
        ).split(' ');
        // console.log(tokenString)
        return tokenString[tokenString.length - 1] || null;
    } catch (err) {
        return null;
    }
};

const auth = (req, res, next) => {
    console.log(getToken(req));
    jwt.verify(
        getToken(req),
        process.env.TOKEN_SECRET,
        function (err, decoded) {
            if (err || !decoded) {
                return res.json({
                    success: false,
                    err: err || 'Unexpected Error Occured!'
                });
            } else {
                // console.log(decoded)
                req.user = decoded;
                next();
            }
        }
    );
};

const isLoggedIn = (req, res, next) => {
    if (!req.user) {
        res.json({
            success: false,
            message: 'Authentication Required!'
        });
    } else if (req.user._id != null) {
        next();
    } else {
        res.json({
            success: false,
            message: 'Temporary Token Found!'
        });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        res.json({
            success: false,
            message: 'Authentication Required!'
        });
    } else if (req.user.isAdmin) {
        next();
    } else {
        res.json({
            success: false,
            message: 'Admin Privileges Required!'
        });
    }
};

module.exports = { isLoggedIn, auth, generateAccessToken, isAdmin };
