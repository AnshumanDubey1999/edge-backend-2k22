const UserSchema = require('../models/user');
const InvoiceSchema = require('../models/invoice');
const TemporaryInvoiceSchema = require('../models/temporaryInvoice');
const EventSchema = require('../models/event');
const razorpay = require('../middlewares/razorpay');
// const s3 = require('../middlewares/s3').s3;

require('dotenv').config();

const getTotalAndValidity = async (eventCodes, registeredEvents) => {
    if (registeredEvents.some((event) => eventCodes.includes(event))) {
        //eventCodes has elements common with registeredEvents
        return {
            sum: 0,
            validity: false,
            error: 'User already has paid for one or more events'
        };
    }
    let sum = 0;
    let intraCount = 0;
    const comboData = [];
    const eventData = [];
    const events = await EventSchema.findAllByEventCode(eventCodes);
    if (events.length != eventCodes.length) {
        //Not all eventCodes resulted in an event
        return {
            sum: 0,
            validity: false,
            error: 'Invalid Event Code'
        };
    }

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.eventType == 'INTRA') intraCount++;
        sum += event.eventPrice;

        //If Combo
        if (event.combos && event.combos.length > 0) {
            if (
                event.combos.some((e) => eventCodes.includes(e)) ||
                event.combos.some((e) => registeredEvents.includes(e)) ||
                event.combos.includes(event.eventCode)
            ) {
                //eventCodes has elements common with registeredEvents or eventCodes
                return {
                    sum: 0,
                    validity: false,
                    error: 'The combo is invalid!'
                };
            }

            //Check eventCode Validity
            const comboEvents = await EventSchema.findAllByEventCode(
                event.combos
            );
            if (
                comboEvents.length != event.combos.length ||
                comboEvents.some((e) => e.combos && e.combos.length > 0)
            ) {
                //Not all event.combos resulted in an event or a combo points to another combo
                return {
                    sum: 0,
                    validity: false,
                    error: 'Invalid Event Found!'
                };
            }
            //Remove ComboCode and put eventCode
            const comboEventData = [];
            comboEvents.forEach((ce) => {
                comboEventData.push({
                    title: ce.title,
                    eventCode: ce.eventCode
                });
            });
            comboData.push({
                title: event.title,
                eventCode: event.eventCode,
                eventPrice: event.eventPrice,
                events: comboEventData
            });

            //Removing combo from eventCodes and adding events of combo to it
            eventCodes.splice(eventCodes.indexOf(event.eventCode), 1);
            eventCodes.push(...event.combos);
        } else {
            eventData.push({
                title: event.title,
                subtitle: event.subtitle,
                eventCode: event.eventCode,
                eventPrice: event.eventPrice
            });
        }
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
        sum,
        validity: true,
        eventData,
        comboData,
        eventCodes
    };
};

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

exports.verifyMailToken = async (req, res) => {
    try {
        // req.user = {
        //     isMailToken: true,
        //     paymentSuccess: true,
        //     invoice: {
        //         _id: 'asdffa-ffaf-ggegsdg-dsgsd',
        //         amount: 59000,
        //         // events: [
        //         //     {
        //         //         title: 'FLAWLESS'
        //         //     },
        //         //     {
        //         //         title: 'BUG HUNT'
        //         //     },
        //         //     {
        //         //         title: 'WEB DEV'
        //         //     },
        //         //     {
        //         //         title: 'FLAWLESS'
        //         //     },
        //         //     {
        //         //         title: 'BUG HUNT'
        //         //     },
        //         //     {
        //         //         title: 'WEB DEV'
        //         //     }
        //         // ],
        //         eventData: [
        //             {
        //                 title: 'FLAWLESS',
        //                 subtitle: 'The game of code',
        //                 eventCode: 'CB001',
        //                 eventPrice: 120
        //             },
        //             {
        //                 title: 'BUG HUNT',
        //                 subtitle: 'The hunt of code',
        //                 eventCode: 'CB003',
        //                 eventPrice: 90
        //             },
        //             {
        //                 title: 'WEB DEV',
        //                 subtitle: 'The build of code',
        //                 eventCode: 'CB006',
        //                 eventPrice: 110
        //             }
        //         ],
        //         comboData: [
        //             {
        //                 title: 'CIIC COMBO',
        //                 eventCode: 'CB001',
        //                 eventPrice: 120,
        //                 events: [
        //                     {
        //                         title: 'BUSINESS MODEL PLAN',
        //                         eventCode: 'CI05'
        //                     },
        //                     {
        //                         title: 'BRAND-IT',
        //                         eventCode: 'CI07'
        //                     }
        //                 ]
        //             },
        //             {
        //                 title: 'ELEVATION COMBO',
        //                 eventCode: 'IV003',
        //                 eventPrice: 150,
        //                 events: [
        //                     {
        //                         title: 'PAPER-O-VATION',
        //                         eventCode: 'IV05'
        //                     },
        //                     {
        //                         title: 'CAD-O-MANIA',
        //                         eventCode: 'IV07'
        //                     }
        //                 ]
        //             }
        //         ]
        //     },
        //     payment: {
        //         method: 'UPI',
        //         amount: 59000,
        //         refundId: 'fsdfds-gdgds-ffdg-dfgdg',
        //         refundReason: 'Aise hi',
        //         id: 'pay_sffedsggrgrgrg'
        //     }
        // };

        if (req.user.paymentSuccess) {
            if (req.user.invoice.events)
                res.render('intraSuccessMail', req.user);
            else res.render('successMail', req.user);
        } else {
            res.render('rejectedMail', req.user);
        }
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
        if (response.sum == 0) {
            user.registeredEvents.push(...eventCodes);
            await user.save();
            return res.status(200).json({
                success: true,
                freeEvents: true
            });
        }

        const invoice = await TemporaryInvoiceSchema.create({
            user: req.user._id,
            amount: response.sum,
            events: response.eventCodes,
            comboData: response.comboData,
            eventData: response.eventData,
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
