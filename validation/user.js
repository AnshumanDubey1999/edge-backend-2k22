const { validate, ValidationError, Joi } = require('express-validation');

const register = {
    body: Joi.object({
        stream: Joi.string().max(31).required(),
        year: Joi.string().required(),
        instituteName: Joi.string().max(51).required()
    })
};

exports.register = validate(register, {}, {});
