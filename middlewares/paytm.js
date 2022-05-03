const paytm = require('paytm-nodejs');

const config = {
    MID: '###############', // Get this from Paytm console
    KEY: '###############', // Get this from Paytm console
    ENV: 'dev', // 'dev' for development, 'prod' for production
    CHANNEL_ID: 'WAP',
    INDUSTRY: 'Retail',
    WEBSITE: 'Default',
    CALLBACK_URL: 'localhost:8080/paytm/webhook' // webhook url for verifying payment
};

// your create payment controller function
exports.generateOrder = async (invoice) => {
    const data = {
        TXN_AMOUNT: invoice.amount, // request amount
        ORDER_ID: String(invoice._id), // any unique order id
        CUST_ID: String(invoice.user) // any unique customer id
    };
    //
    // create Paytm Payment
    paytm.createPayment(config, data, function (err, data) {
        if (err) {
            throw new Error(err); // handle err
        }

        //success will return

        /*{ 
            MID: '###################',
            WEBSITE: 'DEFAULT',
            CHANNEL_ID: 'WAP',
            ORDER_ID: '#########',
            CUST_ID: '#########',
            TXN_AMOUNT: '##',
            CALLBACK_URL: 'localhost:8080/paytm/webhook',
            INDUSTRY_TYPE_ID: 'Retail',
            url: 'https://securegw-stage.paytm.in/order/process',
            checksum: '####################################' 
        }*/

        return data;
    });
};
