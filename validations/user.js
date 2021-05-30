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
        eventCode: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$'))
    })
};

const validateUserId = {
    params: Joi.object({
        user_id: Joi.string().required()
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
