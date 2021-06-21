const { validate, Joi } = require('express-validation');

const validateInsertData = {
    body: Joi.object({
        name: Joi.string(),
        tag: Joi.string(),
        link: Joi.string(),
        order: Joi.number().required()
    })
};

const validateUpdateData = {
    body: Joi.object({
        _id: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9]{24,24}$'))
            .required(),
        name: Joi.string(),
        tag: Joi.string(),
        link: Joi.string(),
        order: Joi.number().required()
    })
};

const validateSponsorId = {
    query: Joi.object({
        _id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')).required()
    })
};

const validatePage = {
    query: Joi.object({
        // page: Joi.number().min(1).required()
    })
};

exports.all = validate(validatePage, {}, {});
exports.add = validate(validateInsertData, {}, {});
exports.update = validate(validateUpdateData, {}, {});
exports.addImage = validate(validateSponsorId, {}, {});
exports.delete = validate(validateSponsorId, {}, {});
