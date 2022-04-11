const nodemailer = require('nodemailer');
const generateAccessToken = require('./auth').generateAccessToken;
const ejs = require('ejs');
const { readFileSync } = require('fs');
const path = require('path');
const transport = nodemailer.createTransport(
    {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use TLS
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        }
    },
    {
        from: process.env.EMAIL_ID
    }
);

//eslint-disable-next-line no-unused-vars
transport.verify((error, _success) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

module.exports.sendPaymentConfirmationMail = async (user, invoice, payment) => {
    const a = String(invoice._id);
    const id =
        a.slice(0, 4) +
        '-' +
        a.slice(4, 8) +
        '-' +
        a.slice(8, 12) +
        '-' +
        a.slice(12, 16) +
        '-' +
        a.slice(16);
    const token = generateAccessToken(
        {
            isMailToken: true,
            paymentSuccess: true,
            invoice: {
                _id: id,
                amount: payment.amount,
                eventData: invoice.eventData,
                comboData: invoice.comboData
            },
            payment: {
                method: payment.method
            }
        },
        '100y',
        process.env.MAIL_TOKEN_SECRET
    );
    var mailOptions = {
        from: process.env.EMAIL_ID,
        to: user.email,
        subject: 'Payment Confirmed',
        text: `Your Payment for ${
            (invoice.events.length == 1 ? 'event ' : 'events ') +
            invoice.events.join(' ,')
        } has been completed. The invoice id is: ${invoice._id}.`,
        html: ejs.render(
            readFileSync(
                path.join(__dirname, '../views/intraSuccessMail.ejs'),
                'utf8'
            ),
            {
                isMailToken: false,
                invoice: {
                    _id: id,
                    amount: payment.amount,
                    eventData: invoice.eventData,
                    comboData: invoice.comboData
                },
                payment: {
                    method: payment.method
                },
                token: token
            }
        )
    };

    return new Promise((resolve, reject) => {
        transport.sendMail(mailOptions, function (err, info) {
            if (err) reject(err);
            else resolve(info);
        });
    });
};

module.exports.sendPaymentRejectionMail = async (payment, email) => {
    const a = String(payment.refundId);
    const id =
        a.slice(0, 4) +
        '-' +
        a.slice(4, 8) +
        '-' +
        a.slice(8, 12) +
        '-' +
        a.slice(12, 16) +
        '-' +
        a.slice(16);
    const token = generateAccessToken(
        {
            isMailToken: true,
            paymentSuccess: false,
            payment: {
                amount: payment.amount,
                refundId: id,
                refundReason: payment.refundReason,
                id: payment.id
            }
        },
        '100y',
        process.env.MAIL_TOKEN_SECRET
    );
    var mailOptions = {
        from: process.env.EMAIL_ID,
        to: email,
        subject: 'Payment Rejected',
        text: `Your Payment has been rejected. 
        Reason: ${payment.refundReason}
        Payment ID: ${payment.id}
        Amount: ${payment.amount / 100 + ' ' + payment.currency}
        Refund ID: ${payment.refundId}
        Your ammount will be refunded within 5-7 working days.`,
        html: ejs.render(
            readFileSync(
                path.join(__dirname, '../views/rejectedMail.ejs'),
                'utf8'
            ),
            {
                isMailToken: false,
                payment: {
                    amount: payment.amount,
                    refundId: id,
                    refundReason: payment.refundReason,
                    id: payment.id
                },
                token: token
            }
        )
    };

    return new Promise((resolve, reject) => {
        transport.sendMail(mailOptions, function (err, info) {
            if (err) reject(err);
            else resolve(info);
        });
    });
};

// module.exports.sendRefundSuccessMail = async (refund, email) => {
//     var mailOptions = {
//         from: process.env.EMAIL_ID,
//         to: email,
//         subject: 'Amount Refunded Successfully',
//         text: `Your Payment has been refunded.
//         Refund ID: ${refund.id}
//         Amount: ${refund.amount / 100 + ' ' + refund.currency}.`
//         // html: ejs.render(
//         //     readFileSync(path.join(__dirname, '../views/mail.ejs'), 'utf8'),
//         //     {
//         //         data: {
//         //             refund
//         //         }
//         //     }
//         // )
//     };

//     return new Promise((resolve, reject) => {
//         transport.sendMail(mailOptions, function (err, info) {
//             if (err) reject(err);
//             else resolve(info);
//         });
//     });
// };

// module.exports.sendRefundFailureMail = async (refund, email) => {
//     var mailOptions = {
//         from: process.env.EMAIL_ID,
//         to: email,
//         bcc: process.env.ADMIN_MAIL,
//         subject: 'Amount Refunded Falied',
//         text: `Your Payment has been refunded.
//         Refund ID: ${refund.id}
//         Amount: ${refund.amount / 100 + ' ' + refund.currency}.
//         Contact ${process.env.ADMIN_MAIL} to sort out the issue.`
//         // html: ejs.render(
//         //     readFileSync(path.join(__dirname, '../views/mail.ejs'), 'utf8'),
//         //     {
//         //         data: {
//         //             refund
//         //         }
//         //     }
//         // )
//     };

//     return new Promise((resolve, reject) => {
//         transport.sendMail(mailOptions, function (err, info) {
//             if (err) reject(err);
//             else resolve(info);
//         });
//     });
// };

module.exports.sendAdminErrorMail = async (error, req, during) => {
    var mailOptions = {
        to: process.env.ADMIN_MAIL,
        from: process.env.EMAIL_ID,
        subject: 'Razor Error | EDGE 2021 | Urgent',
        text: String(error) + '\n\n\n' + JSON.stringify(req.body),
        html: `<h2>Error caused during: ${during}</h2><br/>
        <strong>${String(error)}<br/><br/>${JSON.stringify(req.body)}</strong>`
    };

    return new Promise((resolve, reject) => {
        transport.sendMail(mailOptions, function (err, info) {
            if (err) reject(err);
            else resolve(info);
        });
    });
};
