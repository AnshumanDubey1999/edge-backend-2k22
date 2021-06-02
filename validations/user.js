const { validate, Joi } = require('express-validation');

const register = {
    body: Joi.object({
        stream: Joi.string().max(31).required(),
        year: Joi.string().required(),
        instituteName: Joi.string().max(51).required()
    })
};

const validatePage = {
    query: Joi.object({
        page: Joi.number().min(1).required(),
        eventCode: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$')),
        stream: Joi.string().max(31),
        year: Joi.string(),
        instituteName: Joi.string().max(51),
        name: Joi.string().max(31)
    })
};

const validateUserId = {
    query: Joi.object({
        id: Joi.string(),
        email: Joi.string().email(),
        contact: Joi.string()
    })
};

const validateBodyUserId = {
    body: Joi.object({
        user_id: Joi.string().required()
    })
};

exports.register = validate(register, {}, {});
exports.updateProfile = validate(register, {}, {});

exports.allUsers = validate(validatePage, {}, {});

exports.viewUser = validate(validateUserId, {}, {});
exports.deleteUser = validate(validateBodyUserId, {}, {});
