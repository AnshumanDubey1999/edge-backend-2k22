// const crypto = require('crypto');
// const fetch = require('node-fetch');
const key = process.env.INSTAMOJO_KEY;
// const salt = process.env.INSTAMOJO_SALT;
const auth_token = process.env.INSTAMOJO_AUTH_TOKEN;
const base_url = process.env.BASE_URL;
const frontend_url = process.env.FRONTEND_URL;
const Insta = require('./_instamojo');
Insta.setKeys(key, auth_token);
// Insta.isSandboxMode(true);

exports.generateOrder = (invoice, user) => {
    const data = {
        purpose: 'EDGE Event Registration',
        amount: invoice.amount,
        buyer_name: user.name,
        email: user.email,
        phone: user.contact,
        redirect_url: frontend_url + '/instamojo/status',
        webhook: base_url + '/instamojo/confirm',
        send_email: false,
        send_sms: false,
        allow_repeated_payments: false
    };
    console.log({ data });
    return new Promise((resolve, reject) => {
        Insta.createPayment(data, function (error, response) {
            if (error) {
                console.log({ error });
                reject(error);
            } else {
                // Payment redirection link at response.payment_request.longurl
                console.log({ response });
                resolve(JSON.parse(response).payment_request);
            }
        });
    });
};

exports.generateRefund = (payment) => {
    console.log('41', { payment });
    return new Promise((resolve, reject) => {
        try {
            const refund = new Insta.RefundRequest();
            console.log('44', { refund });
            refund.payment_id = payment.payment_id; // This is the payment_id, NOT payment_request_id
            refund.type = payment.refundType; // Available : ['RFD', 'TNR', 'QFL', 'QNR', 'EWN', 'TAN', 'PTH']
            refund.body = payment.refundReason; // Reason for refund
            refund.setRefundAmount(payment.amount);
            console.log('49', { refund });
            // const data = await Insta.createRefund(refund);
            Insta.createRefund(refund, function (error, response) {
                console.log('here', { error, response });
                if (error) {
                    console.log({ error });
                    reject(error);
                } else {
                    // console.log({ response });
                    resolve(response);
                }
            });
        } catch (error) {
            console.log('61', { error });
            reject(error);
        }
    });
};

exports.verifyPayment = async (payment_request_id, payment_id) => {
    return new Promise((resolve, reject) => {
        Insta.getPaymentDetails(
            payment_request_id,
            payment_id,
            (error, response) => {
                if (error) {
                    console.log({ error });
                    reject(error);
                } else {
                    console.log({ response });
                    resolve(response);
                }
            }
        );
    });
};
