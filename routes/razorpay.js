const express = require('express');
const router = express.Router();
const razor = require('../middlewares/razorpay');
const Payment = require('../models/payment');
const Refund = require('../models/refund');
const Invoice = require('../models/invoice');
const TemporaryInvoice = require('../models/temporaryInvoice');
const User = require('../models/user');
const mail = require('../middlewares/mail');

async function initiateRefund(payment, order, reason, req, temporaryInvoice) {
    try {
        const email = order.notes.email;
        const refVal = await Refund.create({
            temporaryInvoice: temporaryInvoice
        });
        const refund = await razor.generateRefund(
            payment.id,
            email,
            payment.refundReason
        );
        console.log(refund);
        Object.assign(refVal, refund);
        await refVal.save();
        payment.refundRequired = true;
        payment.refundReason = reason;
        payment.refundId = refund.id;
        await payment.save();
        await mail.sendPaymentRejectionMail(payment, email);
    } catch (e) {
        // console.log('Line 125')
        console.log(e);
        mail.sendAdminErrorMail(e, req, 'Creating Refund').catch((e) => {
            console.log(e);
        });
    }
}

router.post('/confirm', razor.verifyRazorWare, async (req, res) => {
    res.status(200).json({
        err: false
    });
    try {
        // console.log(JSON.stringify(req.body));
        if (req.body.event == 'order.paid') {
            let payment = new Payment(req.body.payload.payment.entity);
            payment.razorid = req.body.payload.payment.entity.id;
            payment.orderDetails = req.body.payload.order.entity;
            const temporaryInvoice = await TemporaryInvoice.findById(
                payment.orderDetails.receipt
            );

            if (!temporaryInvoice) {
                await initiateRefund(
                    payment,
                    payment.orderDetails,
                    'Invoice Not found',
                    req,
                    temporaryInvoice
                );
                return;
            }

            //If expired
            let expiryTime = new Date(temporaryInvoice.createdAt);
            expiryTime = new Date(expiryTime.getTime() + 10 * 60000);
            const now = new Date();
            if (now > expiryTime) {
                await initiateRefund(
                    payment,
                    payment.orderDetails,
                    'Invoice Expired',
                    req,
                    temporaryInvoice
                );
                return;
            }
            await TemporaryInvoice.findByIdAndDelete(temporaryInvoice._id);

            //If incorrect amount
            // console.log(temporaryInvoice.amount, payment.orderDetails.amount_paid/100)
            if (
                temporaryInvoice.amount !=
                payment.orderDetails.amount_paid / 100
            ) {
                await initiateRefund(
                    payment,
                    payment.orderDetails,
                    'Paid Amount MisMatch',
                    req,
                    temporaryInvoice
                );
                return;
            }

            const user = await User.findById(temporaryInvoice.user);

            if (!user) {
                await initiateRefund(
                    payment,
                    payment.orderDetails,
                    'User Not Found',
                    req,
                    temporaryInvoice
                );
                return;
            }

            //If user has already paid for one or more events
            if (
                user.registeredEvents.some((event) =>
                    temporaryInvoice.events.includes(event)
                )
            ) {
                await initiateRefund(
                    payment,
                    payment.orderDetails,
                    'User has already paid for one or more events',
                    req,
                    temporaryInvoice
                );
                return;
            }

            //If Intra and already have invoice
            if (
                temporaryInvoice.type == 'INTRA' &&
                user.intraInvoiceId != null
            ) {
                await initiateRefund(
                    payment,
                    payment.orderDetails,
                    'User has already paid for INTRA',
                    req,
                    temporaryInvoice
                );
                return;
            }

            payment = await payment.save();
            const invoice = await Invoice.create({
                user: temporaryInvoice.user,
                amount: temporaryInvoice.amount,
                type: temporaryInvoice.type,
                events: temporaryInvoice.events,
                order_id: temporaryInvoice.order_id,
                payment_id: payment.razorid,
                payment_details: payment._id
            });
            if (temporaryInvoice.type == 'INTRA')
                user.intraInvoiceId = invoice._id;
            user.registeredEvents.push(...temporaryInvoice.events);
            await user.save();
            await mail.sendPaymentConfirmationMail(user, invoice, payment);
        } else if (req.body.event == 'refund.processed') {
            const refund = Refund.findByRefundID(
                req.body.payload.refund.entity.id
            );
            refund.status = 'processed';
            await refund.save();
            const email = req.body.payload.refund.entity.notes.email;
            await mail.sendRefundSuccessMail(refund, email);
        } else if (req.body.event == 'refund.failed') {
            const refund = Refund.findByRefundID(
                req.body.payload.refund.entity.id
            );
            refund.status = 'failed';
            await refund.save();
            const email = req.body.payload.refund.entity.notes.email;
            await mail.sendRefundFailureMail(refund, email);
        }
    } catch (e) {
        // console.log('Line 125')
        console.log(e);
        mail.sendAdminErrorMail(e, req, 'Initiating Payment').catch((e) => {
            console.log(e);
        });
    }
});

// router.post('/confirmRefund', razor.verifyRazorWare, async (req, res) => {
//     res.status(200).json({
//         err: false
//     });
//     try {
//         // console.log(JSON.stringify(req.body));
//         if (req.body.event == 'refund.processed') {
//             const refund = Refund.findByRefundID(
//                 req.body.payload.refund.entity.id
//             );
//             refund.status = 'processed';
//             await refund.save();
//             const email = req.body.payload.refund.entity.notes.email;
//             await mail.sendRefundSuccessMail(refund, email);
//         } else if (req.body.event == 'refund.failed') {
//             const refund = Refund.findByRefundID(
//                 req.body.payload.refund.entity.id
//             );
//             refund.status = 'failed';
//             await refund.save();
//             const email = req.body.payload.refund.entity.notes.email;
//             await mail.sendRefundFailureMail(refund, email);
//         }
//     } catch (e) {
//         console.log(e);
//         mail.sendAdminErrorMail(e, req)
//             .catch((e) => {
//                 console.log(e);
//             })
//             .catch((e) => {
//                 console.log(e);
//             });
//     }
// });

module.exports = router;
