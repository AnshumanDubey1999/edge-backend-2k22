const UserSchema = require('../models/user');
const InvoiceSchema = require('../models/invoice');
const TemporaryInvoiceSchema = require('../models/temporaryInvoice');
const EventSchema = require('../models/event');
const razorpay = require('../middlewares/razorpay');
// const s3 = require('../middlewares/s3').s3;

require('dotenv').config();

const getTotalAndValidity = async (eventCodes, registeredEvents) => {
    if (registeredEvents.some((event) => eventCodes.includes(event)))
        //eventCodes has elements common with registeredEvents
        return {
            sum: 0,
            validity: false,
            error: 'User already has paid for one or more events'
        };

    let sum = 0;
    let intraCount = 0;
    let validity = true;
    for (let i = 0; i < eventCodes.length; i++) {
        const event = await EventSchema.findByEventCode(eventCodes[i]).lean();
        if (event == undefined) {
            validity = false;
            break;
        }
        if (event.eventType == 'INTRA') intraCount++;
        sum += event.eventPrice;
    }
    if (intraCount > 0) {
        if (intraCount != eventCodes.length) {
            return {
                sum: 0,
                validity: false,
                error: 'Mixture of Intra and Edge Events Found.'
            };
        }
        return {
            sum: Number(process.env.INTRA_AMOUNT) || 300,
            validity: true,
            intra: true
        };
    }
    return {
        sum: sum,
        validity: validity,
        error: validity ? '' : 'Invalid Event Code'
    };
};

// exports.validatePayment = async (req, res, next) => {
//     try {
//         const user = await UserSchema.findById(req.user._id);
//         const invoice = await InvoiceSchema.findById(req.params.invoice_id);
//         const eventCodes = invoice.events;
//         if (invoice.user != req.user._id) {
//             throw new Error('User does not have permission to update invoice.');
//         } else if (invoice.isPaid) {
//             throw new Error('User has already paid for this invoice.');
//         } else if (
//             user.registeredEvents.some((event) => eventCodes.includes(event))
//         ) {
//             throw new Error(
//                 'User has already paid for one or more events in this invoice.'
//             );
//         }
//         return next();
//     } catch (error) {
//         // console.log(error);
//         res.json({
//             success: false,
//             err: error.message
//         });
//     }
// };

exports.myInvoices = async (req, res) => {
    try {
        const limit = 20;
        const skip = (Number(req.query.page) - 1) * 20;
        const invoices = await InvoiceSchema.findByUser(req.user._id)
            .skip(skip)
            .limit(limit)
            .populate('payment_details');
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
        const invoice = await InvoiceSchema.findById(
            req.params.invoice_id
        ).populate('payment_details');
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

// exports.getImage = async (req, res) => {
//     try {
//         const invoice = await InvoiceSchema.findById(req.params.invoice_id);
//         if (!(req.user.isAdmin || req.user._id == invoice.user))
//             throw new Error('User does not have permission to view invoice.');
//         s3.getObject(
//             {
//                 Bucket: 'edge-results',
//                 Key: 'invoice/' + req.params.invoice_id + '.jpg'
//             },
//             (err, data) => {
//                 if (err) {
//                     res.send({ error: err });
//                 } else {
//                     res.send(data.Body);
//                 }
//             }
//         );
//     } catch (error) {
//         console.log(error);
//         res.json({
//             success: false,
//             err: error.message
//         });
//     }
// };

exports.createInvoice = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user._id);
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

        //FOR INTRA
        if (response.intra) {
            if (user.intraInvoiceId != null) {
                const invoice = await InvoiceSchema.findById(
                    user.intraInvoiceId
                );
                for (let i = 0; i < eventCodes.length; i++) {
                    const code = eventCodes[i];
                    if (!invoice.events.includes(code))
                        invoice.events.push(code);
                }
                user.registeredEvents.push(...eventCodes);
                await invoice.save();
                await user.save();
                return res.status(200).json({
                    success: true,
                    invoice: invoice,
                    intraInvoice: true
                });
            }
        }

        const invoice = await TemporaryInvoiceSchema.create({
            user: req.user._id,
            amount: response.sum,
            events: eventCodes,
            type: response.intra ? 'INTRA' : 'EDGE'
        });

        const order = await razorpay.generateOrder(
            invoice.amount,
            String(invoice._id),
            user.email
        );
        invoice.order_id = order.id;
        invoice.save();

        res.status(200).json({
            success: true,
            invoice: invoice,
            order: order
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

// exports.updateInvoice = async (req, res) => {
//     try {
//         const invoice = await InvoiceSchema.findById(req.params.invoice_id);
//         if (!(req.user.isAdmin || req.user._id == invoice.user))
//             throw new Error('User does not have permission to view invoice.');
//         if (invoice.isPaid) {
//             return res.status(200).json({
//                 success: false,
//                 error: 'No modification allowed after payment is completed!'
//             });
//         }
//         const user = await UserSchema.findById(req.user._id).lean();
//         const eventCodes = req.body.eventCodes;
//         const response = await getTotalAndValidity(
//             eventCodes,
//             user.registeredEvents
//         );
//         if (!response.validity) {
//             return res.status(200).json({
//                 success: false,
//                 error: response.error
//             });
//         }
//         invoice.amount = response.sum;
//         invoice.events = eventCodes;
//         await invoice.save();
//         res.status(200).json({
//             success: true,
//             invoice: invoice
//         });
//     } catch (error) {
//         console.log(error);
//         res.json({
//             success: false,
//             err: error.message
//         });
//     }
// };

// exports.payInvoice = async (req, res) => {
//     try {
//         const user = await UserSchema.findById(req.user._id);
//         const invoice = await InvoiceSchema.findById(req.params.invoice_id);
//         const eventCodes = invoice.events;
//         // if (
//         //     invoice.isPaid ||
//         //     user.registeredEvents.some((event) => eventCodes.includes(event))
//         // ) {
//         //     //eventCodes has elements common with registeredEvents
//         //     invoice.isPaid = true;
//         //     invoice.hasIssues = true;
//         //     await invoice.save();
//         //     return res.status(200).json({
//         //         success: false,
//         //         error: 'User already has paid for one or more events'
//         //     });
//         // }
//         invoice.isPaid = true;
//         user.registeredEvents.push(...eventCodes);
//         await user.save();
//         await invoice.save();
//         res.status(200).json({
//             success: true,
//             invoice: invoice
//         });
//     } catch (error) {
//         console.log(error);
//         res.json({
//             success: false,
//             err: error.message
//         });
//     }
// };

//ADMIN ONLY
exports.allInvoices = async (req, res) => {
    try {
        const limit = 20;
        const skip = (Number(req.query.page) - 1) * 20;
        const invoices = await InvoiceSchema.find()
            .skip(skip)
            .limit(limit)
            .populate('payment_details');
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

// exports.approveInvoice = async (req, res) => {
//     try {
//         const invoice = await InvoiceSchema.findById(req.body.invoice_id);
//         invoice.isApproved = true;
//         invoice.approvedBy = req.user._id;
//         await invoice.save();
//         res.status(200).json({
//             success: true,
//             invoice: invoice
//         });
//     } catch (error) {
//         console.log(error);
//         res.json({
//             success: false,
//             err: error.message
//         });
//     }
// };

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
