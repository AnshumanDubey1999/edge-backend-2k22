const express = require('express');
const router = express.Router();
const Payment = require('../models/payment');
const Refund = require('../models/refund');
const Invoice = require('../models/invoice');
const TemporaryInvoice = require('../models/temporaryInvoice');
const User = require('../models/user');
const mail = require('../middlewares/mail');
const instamojo = require('../middlewares/instamojo');

async function initiateRefund(payment, type, reason, req, temporaryInvoice) {
    try {
        console.log({ type, reason, req });
        const email = payment.buyer;
        payment.refundRequired = true;
        payment.refundType = type;
        payment.refundReason = reason;
        const refund = await instamojo.generateRefund(payment);
        console.log(refund);
        const refund_object = await Refund.create({
            temporaryInvoice: temporaryInvoice,
            ...refund
        });
        payment.refundId = refund_object.id;
        await payment.save();
        await mail.sendPaymentRejectionMail(
            {
                refundId: refund_object.id,
                amount: payment.amount * 100,
                refundReason: reason,
                id: payment.payment_id
            },
            email
        );
    } catch (e) {
        console.log('Line 125');
        console.log({ e });
        mail.sendAdminErrorMail(e, req, 'Creating Refund').catch((e) => {
            console.log(e);
        });
    }
}

// router.use()

router.post('/confirm', async (req, res) => {
    res.status(200).json({
        err: false
    });
    try {
        // console.log(JSON.stringify(req.body));
        console.log({
            b: req.body,
            h: req.headers,
            q: req.query,
            p: req.params
        });
        const data = req.body;
        console.log({ data, t: typeof data });
        let payment = new Payment({ ...data });
        console.log({ data, payment });
        let payment_data = await instamojo.verifyPayment(
            payment.payment_request_id,
            payment.payment_id
        );
        if (!payment_data.success || !payment_data.payment_request) {
            return;
        }
        payment_data = payment_data.payment_request;
        if (payment_data.status !== 'Completed') {
            return;
        }
        console.log({ payment_data });
        const temporaryInvoice = await TemporaryInvoice.findByInstaMojoId(
            payment.payment_request_id
        );

        if (!temporaryInvoice) {
            await initiateRefund(
                payment,
                'TNR',
                'Invoice Not found',
                req.headers,
                temporaryInvoice
            );
            return;
        }

        if (temporaryInvoice.instamojo_status === 'success') {
            return;
        }

        //If expired
        let expiryTime = new Date(temporaryInvoice.createdAt);
        expiryTime = new Date(expiryTime.getTime() + 10 * 60000);
        const now = new Date();
        if (now > expiryTime) {
            await initiateRefund(
                payment,
                'RFD',
                'Invoice Expired',
                req.headers,
                temporaryInvoice
            );
            return;
        }

        //If incorrect amount
        // console.log(temporaryInvoice.amount, payment.orderDetails.amount_paid/100)
        console.log({
            temporaryInvoice,
            a: Number(payment_data.amount),
            b: temporaryInvoice.amount,
            c: Number(payment_data.amount) != temporaryInvoice.amount
        });
        if (Number(payment_data.amount) !== temporaryInvoice.amount) {
            await initiateRefund(
                payment,
                'PTH',
                'Payment Amount Mismatch',
                req.headers,
                temporaryInvoice
            );
            return;
        }

        const user = await User.findById(temporaryInvoice.user);

        if (!user) {
            await initiateRefund(
                payment,
                'TNR',
                'User Not Found',
                req.headers,
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
                'RFD',
                'User has already paid for one or more events',
                req.headers,
                temporaryInvoice
            );
            return;
        }

        //If Intra and already have invoice
        if (temporaryInvoice.type == 'INTRA' && user.intra22InvoiceId != null) {
            await initiateRefund(
                payment,
                'RFD',
                'User has already paid for INTRA',
                req.headers,
                temporaryInvoice
            );
            temporaryInvoice;
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
            instamojo_id: temporaryInvoice.instamojo_id,
            payment_id: payment.mihpayid,
            payment_details: payment._id
        });
        if (temporaryInvoice.type == 'INTRA')
            user.intra22InvoiceId = invoice._id;
        user.registeredEvents.push(...temporaryInvoice.events);
        await user.save();
        temporaryInvoice.instamojo_status = 'success';
        await temporaryInvoice.save();
        await mail.sendPaymentConfirmationMail(user, invoice, {
            method: 'Instamojo'
        });
    } catch (e) {
        console.log('Line 160');
        console.log({ e });
        mail.sendAdminErrorMail(e, req.headers, 'Initiating Payment').catch(
            (e) => {
                console.log(e);
            }
        );
    }
});

router.get('/status', async (req, res) => {
    try {
        console.log('________________________________________________________');
        console.log({
            b: req.body,
            h: req.headers,
            q: req.query,
            p: req.params
        });
        // const temporaryInvoice = await TemporaryInvoice.findByInstaMojoId(
        //     req.query.payment_request_id
        // );

        let payment_data = await instamojo.verifyPayment(
            req.query.payment_request_id,
            req.query.payment_id
        );
        console.log({ payment_data });
        if (!payment_data.success || !payment_data.payment_request) {
            return res.redirect(process.env.FRONTEND_URL + '/paymentfailure');
        }
        payment_data = payment_data.payment_request;
        if (payment_data.status !== 'Completed') {
            return res.redirect(process.env.FRONTEND_URL + '/paymentfailure');
        }
        res.redirect(
            process.env.FRONTEND_URL +
                '/paymentsuccess?id=' +
                req.query.payment_request_id
        );

        // res.status(200).json({
        //     success: true,
        //     status: temporaryInvoice.instamojo_status || 'failure'
        // });
        // console.log(temporaryInvoice);
        // if (temporaryInvoice.instamojo_status === 'success')
        //     return res.redirect(process.env.FRONTEND_URL + '/paymentsuccess');
        // res.redirect(process.env.FRONTEND_URL + '/paymentfailure');
    } catch (error) {
        res.redirect(process.env.FRONTEND_URL + '/paymentfailure');
    }
});

module.exports = router;
