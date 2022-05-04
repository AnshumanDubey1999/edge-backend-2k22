const crypto = require('crypto');
const fetch = require('node-fetch');
const key = process.env.INSTAMOJO_KEY;
const salt = process.env.INSTAMOJO_SALT;
const auth_token = process.env.INSTAMOJO_AUTH_TOKEN;
const base_url = process.env.BASE_URL;
const frontend_url = process.env.FRONTEND_URL;

// const getAuthToken = async () => {
//     return fetch('https://api.instamojo.com/oauth2/token/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             Accept: 'application/json'
//         },
//         body: JSON.stringify({

//         })
//     });
// }

// const hashFunction = (plainText) => {
//     const hashedText = crypto
//         .createHash('sha512')
//         .update(String(plainText))
//         .digest('base64');
//     return hashedText;
// };

exports.generateOrder = async (invoice, user) => {
    const res = await fetch('https://api.instamojo.com/v2/payment_requests/', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + auth_token
        },
        body: JSON.stringify({
            purpose: invoice.type,
            amount: invoice.amount.toFixed(2),
            buyer_name: user.name,
            email: user.email,
            phone: user.contact,
            redirect_url: frontend_url + '/instamojo/status',
            webhook: base_url + '/instamojo/confirm',
            send_email: false,
            send_sms: false,
            allow_repeated_payments: false
        })
    });
    return await res.json();
};

exports.verifyHash = (payment, invoice) => {
    const hash = hashFunction(
        salt +
            '|' +
            payment.status +
            '|||||||||||' +
            invoice.order.email +
            '|' +
            invoice.order.firstname +
            '|' +
            invoice.type +
            '|' +
            invoice.amount.toFixed(2) +
            '|' +
            invoice._id +
            '|' +
            merchantID
    );
    return hash === payment.hash;
};

exports.generateRefund = async (payment, invoice) => {
    const hash = hashFunction(
        merchantID +
            '|cancel_refund_transaction|' +
            payment.mihpayid +
            '|' +
            salt
    );
    const body = {
        key: merchantID,
        command: 'cancel_refund_transaction',
        var1: payment.mihpayid,
        var2: invoice._id.slice(0, 23),
        // var3: invoice.amount.toFixed(2),
        // var4: '',
        // var5: '',
        // var6: '{}',
        hash
    };
    const response = await fetch(process.env.PAYU_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
        },
        body: Object.keys(body)
            .map((k) => `${k}=${body[k]}`)
            .join('&')
    });
    return await response.json();
};
