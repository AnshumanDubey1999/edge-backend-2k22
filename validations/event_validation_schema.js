const Joi = require('joi');

exports.eventSchema = Joi.object({
    id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')),
    title: Joi.string().required(),
    subtitle: Joi.string(),
    desc: Joi.string(),
    eventPrice: Joi.number().required(),
    isActive: Joi.boolean(),
    eventCode: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$')),
    discount: Joi.number().min(0).max(70),
    combos: Joi.array().items(
        Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$'))
    ),
    cid: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')),
    eventType: Joi.string().valid('INTRA', 'EDGE'),
    club: Joi.string().required(),
    rules: Joi.array(),
    contacts: Joi.array()
});
exports.eventParamsSchema = Joi.object({
    id: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{24,24}$')),
    eventCode: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{1,500}$'))
});
