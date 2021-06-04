const { validate, Joi } = require('express-validation');

const validateEventCodes = {
    body: Joi.object({
        eventCodes: Joi.array()
            .items(
                Joi.string()
                    .required()
                    .pattern(new RegExp('^[a-zA-Z0-9]{1,500}$'))
            )
            .min(1)
            .required()
    })
};

const validateInvoiceId = {
    params: Joi.object({
        invoice_id: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9]{24,24}$'))
            .required()
    })
};

const validatePage = {
    query: Joi.object({
        page: Joi.number().min(1).required()
    })
};

const validateBodyInvoiceId = {
    body: Joi.object({
        invoice_id: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9]{24,24}$'))
            .required()
    })
};

exports.createInvoice = validate(validateEventCodes, {}, {});
exports.updateInvoice = validate(validateEventCodes, {}, {});

exports.viewInvoice = validate(validateInvoiceId, {}, {});
exports.payInvoice = validate(validateInvoiceId, {}, {});
exports.getImage = validate(validateInvoiceId, {}, {});

exports.approveInvoice = validate(validateBodyInvoiceId, {}, {});
exports.deleteInvoice = validate(validateBodyInvoiceId, {}, {});

exports.myInvoices = validate(validatePage, {}, {});
exports.allInvoices = validate(validatePage, {}, {});
