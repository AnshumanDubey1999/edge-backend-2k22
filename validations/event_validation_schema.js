const Joi = require('joi');

exports.eventSchema = Joi.object({
    id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')),
    title: Joi.string(),
    desc: Joi.string(),
    eventPrice: Joi.number(),
    isActive: Joi.boolean(),
    eventCode: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$')),
    discount: Joi.number().min(0).max(70),
    combos: [Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$'))]
});
exports.eventParamsSchema = Joi.object({
    id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')),
    eventCode: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$'))
});
