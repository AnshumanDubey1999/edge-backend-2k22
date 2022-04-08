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
        year: Joi.string().max(10),
        instituteName: Joi.string().max(51),
        name: Joi.string().max(31)
    })
};

const validateCSVRequest = {
    query: Joi.object({
        eventCode: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$')),
        stream: Joi.string().max(31),
        year: Joi.string().max(10),
        instituteName: Joi.string().max(51),
        name: Joi.string().max(31)
    })
};

const validateUserId = {
    query: Joi.object({
        id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')),
        email: Joi.string().email(),
        contact: Joi.string()
    })
};

const validateBodyUserId = {
    body: Joi.object({
        user_id: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9]{24,24}$'))
            .required()
    })
};

const validateAddUser = {
    body: Joi.object({
        email: Joi.string().email().required(),
        events: Joi.array()
            .items(
                Joi.string()
                    .required()
                    .pattern(new RegExp('^[a-zA-Z0-9]{1,500}$'))
            )
            .min(1)
            .required()
    })
};

exports.register = validate(register, {}, {});
exports.updateProfile = validate(register, {}, {});

exports.allUsers = validate(validatePage, {}, {});
exports.toCSV = validate(validateCSVRequest, {}, {});

exports.viewUser = validate(validateUserId, {}, {});
exports.deleteUser = validate(validateBodyUserId, {}, {});

exports.addUser = validate(validateAddUser, {}, {});
