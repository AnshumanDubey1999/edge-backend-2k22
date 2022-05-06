const jwt = require('jsonwebtoken');
// const user = require('../models/user');
require('dotenv').config();

const generateAccessToken = (
    user,
    expiresIn,
    token_secret = process.env.TOKEN_SECRET
) => {
    // const secret = process.env.JWT_SECRET;
    // console.log("secret", process.env.JWT_SECRET)
    // console.log(user);
    const token = jwt.sign(user, token_secret, {
        expiresIn: expiresIn
    });
    return token;
};

const getToken = (req) => {
    try {
        const tokenString = (
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

const auth = (req, token_secret = process.env.TOKEN_SECRET) => {
    // console.log(getToken(req));
    return jwt.verify(getToken(req), token_secret, function (err, decoded) {
        if (err || !decoded) {
            return {
                success: false,
                err: err || 'Unexpected Error Occured!'
            };
        } else {
            return {
                success: true,
                user: decoded
            };
        }
    });
};

const isLoggedIn = (req, res, next) => {
    const response = auth(req);
    if (!response.success) {
        res.json({
            success: false,
            message: 'Authentication Failed!'
        });
    } else if (response.user._id != null) {
        req.user = response.user;
        next();
    } else {
        res.json({
            success: false,
            message: 'Temporary Token Found!'
        });
    }
};

const isTemporary = (req, res, next) => {
    const response = auth(req);
    // console.log(response)
    if (!response.success) {
        res.json({
            success: false,
            message: 'Authentication Failed!'
        });
    } else if (response.user._id == null) {
        req.user = response.user;
        next();
    } else {
        res.json({
            success: false,
            message: 'Invalid Token Found!'
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

const isMailToken = (req, res, next) => {
    const response = auth(req, process.env.MAIL_TOKEN_SECRET);
    // console.log(response)
    if (!response.success) {
        res.json({
            success: false,
            message: 'Invalid Email Token Found!'
        });
    } else if (response.user.isMailToken) {
        req.user = response.user;
        next();
    } else {
        res.json({
            success: false,
            message: 'Invalid Token Found!'
        });
    }
};

module.exports = {
    isLoggedIn,
    isTemporary,
    generateAccessToken,
    isAdmin,
    isMailToken,
    auth
};
