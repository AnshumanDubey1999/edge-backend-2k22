const crypto = require('crypto');
const fetch = require('node-fetch');
const merchantID = process.env.PAYU_MERCHANT_ID;
const salt = process.env.PAYU_SALT;
const base_url = process.env.BASE_URL;

const hashFunction = (plainText) => {
    const hashedText = crypto
        .createHash('sha512')
        .update(String(plainText))
        .digest('base64');
    return hashedText;
};

exports.generateOrder = (invoice, user) => {
    const hash = hashFunction(
        merchantID +
            '|' +
            String(invoice._id) +
            '|' +
            invoice.amount.toFixed(2) +
            '|' +
            invoice.type +
            '|' +
            user.name +
            '|' +
            user.email +
            '|||||||||||' +
            salt
    );
    return {
        key: merchantID,
        txnid: String(invoice._id),
        productinfo: invoice.type,
        amount: invoice.amount.toFixed(2),
        email: user.email,
        firstname: user.name,
        lastname: '',
        surl: base_url + '/payu/success',
        furl: base_url + '/payu/failure',
        phone: user.contact,
        hash
    };
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
