const express = require('express');
const router = express.Router();
const razor = require('../middlewares/razorpay');
const Payment = require('../models/payment');
const Refund = require('../models/refund');
const Invoice = require('../models/invoice');
const TemporaryInvoice = require('../models/temporaryInvoice');
const User = require('../models/user');
const mail = require('../middlewares/mail');

async function initiateRefund(payment, order, reason) {
    const email = order.notes.email;
    const refund = razor.generateRefund(
        payment.id,
        email,
        payment.refundReason
    );
    await Refund.create(refund);
    payment.refundRequired = true;
    payment.refundReason = reason;
    payment.refundId = refund.id;
    await payment.save();
    await mail.sendPaymentRejectionMail(payment, email);
}

router.post('/confirmPayment', razor.verifyRazorWare, async (req, res) => {
    res.status(200).json({
        err: false
    });
    try {
        // console.log(JSON.stringify(req.body));
        if (req.body.event !== 'order.paid') return;

        let payment = new Payment(req.body.payload.payment.entity);
        payment.razorid = req.body.payload.payment.entity.id;
        payment.orderDetails = req.body.payload.order.entity;
        const temporaryInvoice = await TemporaryInvoice.findById(
            payment.orderDetails.receipt
        );

        if (!temporaryInvoice) {
            payment.refundRequired = true;
            payment.refundReason = 'Invoice Not found';
            await payment.save();
            await initiateRefund(payment, payment.orderDetails);
            return;
        }

        //If expired
        let expiryTime = new Date(temporaryInvoice.createdAt);
        expiryTime = new Date(expiryTime.getTime() + 10 * 60000);
        const now = new Date();
        if (now > expiryTime) {
            payment.refundReason = 'Invoice Expired';
            payment.refundRequired = true;
            await payment.save();
            await initiateRefund(payment, payment.orderDetails);
            return;
        }
        await TemporaryInvoice.findByIdAndDelete(temporaryInvoice._id);

        //If incorrect amount
        if (temporaryInvoice.total != payment.orderDetails.amount_paid / 100) {
            payment.refundRequired = true;
            payment.refundReason = 'Paid Amount MisMatch';
            await payment.save();
            await initiateRefund(payment, payment.orderDetails);
            return;
        }

        const user = await User.findById(temporaryInvoice.user);

        if (!user) {
            payment.refundRequired = true;
            payment.refundReason = 'User Not Found';
            await payment.save();
            await initiateRefund(payment, payment.orderDetails);
            return;
        }

        //If user has already paid for one or more events
        if (
            user.registeredEvents.some((event) =>
                temporaryInvoice.events.includes(event)
            )
        ) {
            payment.refundRequired = true;
            payment.refundReason =
                'User has already paid for one or more events';
            await payment.save();
            await initiateRefund(payment, payment.orderDetails);
            return;
        }

        //If Intra and already have invoice
        if (temporaryInvoice.type == 'INTRA' && user.intraInvoiceId != null) {
            payment.refundRequired = true;
            payment.refundReason = 'User has already paid for INTRA';
            await payment.save();
            await initiateRefund(payment, payment.orderDetails);
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
        if (temporaryInvoice.type == 'INTRA') user.intraInvoiceId = invoice._id;
        user.registeredEvents.push(...temporaryInvoice.events);
        await user.save();
        await mail.sendPaymentConfirmationMail(user, invoice, payment);
    } catch (e) {
        console.log(e);
        mail.sendAdminErrorMail(e, req)
            .catch((e) => {
                console.log(e);
            })
            .catch((e) => {
                console.log(e);
            });
    }
});

router.post('/confirmRefund', razor.verifyRazorWare, async (req, res) => {
    res.status(200).json({
        err: false
    });
    try {
        // console.log(JSON.stringify(req.body));
        if (req.body.event == 'refund.processed') {
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
        console.log(e);
        mail.sendAdminErrorMail(e, req)
            .catch((e) => {
                console.log(e);
            })
            .catch((e) => {
                console.log(e);
            });
    }
});

module.exports = router;
