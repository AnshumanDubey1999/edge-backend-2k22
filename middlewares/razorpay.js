const RazorPay = require('razorpay');
const instance = new RazorPay({
    key_id: process.env.RP_ID,
    key_secret: process.env.RP_SECRET
});

exports.generateOrder = (amount, invoice_id, email) => {
    return instance.orders.create({
        amount: amount * 100, // amount in the smallest currency unit
        currency: 'INR',
        receipt: invoice_id,
        notes: {
            email: email
        }
    });
};
exports.getPaymentDetails = (paymentId) => {
    return instance.payments.fetch(paymentId);
};
exports.verifyRazorWare = (req, res, next) => {
    if (
        RazorPay.validateWebhookSignature(
            JSON.stringify(req.body),
            req.headers['x-razorpay-signature'],
            process.env.RP_WEBHOOK_SECRET
        )
    )
        next();
    else
        res.status(400).json({
            err: true,
            msg: 'Razor Validation failed'
        });
};
exports.generateRefund = (payment_id, email, reason) => {
    return instance.payments.refund(payment_id, {
        speed: 'optimum',
        notes: {
            email: email,
            reason: reason
        }
    });
};
