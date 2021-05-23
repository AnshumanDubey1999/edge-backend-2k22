const Joi = require('joi');

exports.categorySchema = Joi.object({
    id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')),
    title: Joi.string(),
    desc: Joi.string()
});
