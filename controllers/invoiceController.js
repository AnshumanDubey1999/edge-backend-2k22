const UserSchema = require('../models/user');
const InvoiceSchema = require('../models/invoice');
const EventSchema = require('../models/event');

const getTotalAndValidity = async (eventCodes, registeredEvents) => {
    if (registeredEvents.some((event) => eventCodes.includes(event)))
        //eventCodes has elements common with registeredEvents
        return {
            sum: 0,
            validity: false,
            error: 'User already has paid for one or more events'
        };

    let sum = 0;
    let validity = true;
    for (let i = 0; i < eventCodes.length; i++) {
        const event = await EventSchema.findByEventCode(eventCodes[i]).lean();
        if (event == undefined) {
            validity = false;
            break;
        }
        sum += event.eventPrice;
    }
    return {
        sum: sum,
        validity: validity,
        error: validity ? '' : 'Invalid Event Code'
    };
};

exports.validatePayment = async (req, res, next) => {
    try {
        const user = await UserSchema.findById(req.user._id);
        const invoice = await InvoiceSchema.findById(req.params.invoice_id);
        const eventCodes = invoice.events;
        if (invoice.user != req.user._id) {
            throw new Error('User does not have permission to update invoice.');
        } else if (invoice.isPaid) {
            throw new Error('User has already paid for this invoice.');
        } else if (
            user.registeredEvents.some((event) => eventCodes.includes(event))
        ) {
            throw new Error(
                'User has already paid for one or more events in this invoice.'
            );
        }
        return next();
    } catch (error) {
        // console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.myInvoices = async (req, res) => {
    try {
        const limit = 20;
        const skip = (Number(req.query.page) - 1) * 20;
        const invoices = await InvoiceSchema.findByUser(req.user._id)
            .skip(skip)
            .limit(limit);
        res.status(200).json({
            success: true,
            invoices: invoices
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.viewInvoice = async (req, res) => {
    try {
        const invoice = await InvoiceSchema.findById(req.params.invoice_id);
        if (!(req.user.isAdmin || req.user._id == invoice.user))
            throw new Error('User does not have permission to view invoice.');
        res.status(200).json({
            success: true,
            invoice: invoice
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user._id).lean();
        const eventCodes = req.body.eventCodes;
        const response = await getTotalAndValidity(
            eventCodes,
            user.registeredEvents
        );
        if (!response.validity) {
            return res.status(200).json({
                success: false,
                error: response.error
            });
        }
        const invoice = {
            user: req.user._id,
            amount: response.sum,
            events: eventCodes
        };

        const newInvoice = await InvoiceSchema.create(invoice);
        res.status(200).json({
            success: true,
            invoice: newInvoice
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await InvoiceSchema.findById(req.params.invoice_id);
        if (!(req.user.isAdmin || req.user._id == invoice.user))
            throw new Error('User does not have permission to view invoice.');
        if (invoice.isPaid) {
            return res.status(200).json({
                success: false,
                error: 'No modification allowed after payment is completed!'
            });
        }
        const user = await UserSchema.findById(req.user._id).lean();
        const eventCodes = req.body.eventCodes;
        const response = await getTotalAndValidity(
            eventCodes,
            user.registeredEvents
        );
        if (!response.validity) {
            return res.status(200).json({
                success: false,
                error: response.error
            });
        }
        invoice.amount = response.sum;
        invoice.events = eventCodes;
        await invoice.save();
        res.status(200).json({
            success: true,
            invoice: invoice
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.payInvoice = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user._id);
        const invoice = await InvoiceSchema.findById(req.params.invoice_id);
        const eventCodes = invoice.events;
        // if (
        //     invoice.isPaid ||
        //     user.registeredEvents.some((event) => eventCodes.includes(event))
        // ) {
        //     //eventCodes has elements common with registeredEvents
        //     invoice.isPaid = true;
        //     invoice.hasIssues = true;
        //     await invoice.save();
        //     return res.status(200).json({
        //         success: false,
        //         error: 'User already has paid for one or more events'
        //     });
        // }
        invoice.isPaid = true;
        user.registeredEvents.push(...eventCodes);
        await user.save();
        await invoice.save();
        res.status(200).json({
            success: true,
            invoice: invoice
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

//ADMIN ONLY
exports.allInvoices = async (req, res) => {
    try {
        const limit = 20;
        const skip = (Number(req.query.page) - 1) * 20;
        const invoices = await InvoiceSchema.find().skip(skip).limit(limit);
        res.status(200).json({
            success: true,
            invoices: invoices
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.approveInvoice = async (req, res) => {
    try {
        const invoice = await InvoiceSchema.findById(req.body.invoice_id);
        invoice.isApproved = true;
        invoice.approvedBy = req.user._id;
        await invoice.save();
        res.status(200).json({
            success: true,
            invoice: invoice
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await InvoiceSchema.findByIdAndDelete(
            req.body.invoice_id
        );
        const user = await UserSchema.findById(invoice.user);
        user.registeredEvents = user.registeredEvents.filter(
            (event) => !invoice.events.includes(event)
        );
        await user.save();
        res.status(200).json({
            success: true,
            invoice: invoice
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};
