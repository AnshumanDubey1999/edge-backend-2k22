const express = require('express');
const router = express.Router();
const payu = require('../middlewares/payu');
const Payment = require('../models/payment');
const Refund = require('../models/refund');
const Invoice = require('../models/invoice');
const TemporaryInvoice = require('../models/temporaryInvoice');
const User = require('../models/user');
const mail = require('../middlewares/mail');

async function initiateRefund(payment, reason, req, temporaryInvoice) {
    try {
        const email = payment.email;
        const refund = await payu.generateRefund(payment, temporaryInvoice);
        await Refund.create({
            temporaryInvoice: temporaryInvoice,
            ...refund
        });
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

// router.use()

router.post('/success', async (req, res) => {
    res.status(200).json({
        err: false
    });
    try {
        // console.log(JSON.stringify(req.body));
        let payment = new Payment(req.body.query);
        const temporaryInvoice = await TemporaryInvoice.findById(payment.txnid);

        if (!temporaryInvoice) {
            await initiateRefund(
                payment,
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
                'Invoice Expired',
                req,
                temporaryInvoice
            );
            return;
        }

        //If incorrect amount
        // console.log(temporaryInvoice.amount, payment.orderDetails.amount_paid/100)
        if (!payu.verifyHash(payment, temporaryInvoice)) {
            await initiateRefund(
                payment,
                'Payment Details Mismatch',
                req,
                temporaryInvoice
            );
            return;
        }

        const user = await User.findById(temporaryInvoice.user);

        if (!user) {
            await initiateRefund(
                payment,
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
                'User has already paid for one or more events',
                req,
                temporaryInvoice
            );
            return;
        }

        //If Intra and already have invoice
        if (temporaryInvoice.type == 'INTRA' && user.intra22InvoiceId != null) {
            await initiateRefund(
                payment,
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
            eventData: temporaryInvoice.eventData,
            comboData: temporaryInvoice.comboData,
            order_id: temporaryInvoice.order_id,
            payment_id: payment.mihpayid,
            payment_details: payment._id
        });
        if (temporaryInvoice.type == 'INTRA')
            user.intra22InvoiceId = invoice._id;
        user.registeredEvents.push(...temporaryInvoice.events);
        await user.save();
        await TemporaryInvoice.findByIdAndDelete(temporaryInvoice._id);
        await mail.sendPaymentConfirmationMail(user, invoice, payment);
    } catch (e) {
        // console.log('Line 125')
        console.log(e);
        mail.sendAdminErrorMail(e, req, 'Initiating Payment').catch((e) => {
            console.log(e);
        });
    }
});

router.post('/failure', async (req, res) => {
    console.log(req.query);
    res.status(200).json({
        err: false
    });
});

module.exports = router;
