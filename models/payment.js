const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PaymentSchema = new Schema(
    {
        id: String,
        entity: String,
        amount: Number,
        currency: String,
        status: String,
        order_id: String,
        invoice_id: String,
        international: Boolean,
        method: String,
        amount_refunded: Number,
        refund_status: String,
        captured: Boolean,
        description: String,
        card_id: String,
        bank: String,
        wallet: String,
        vpa: String,
        email: String,
        contact: String,
        notes: Object,
        fee: Number,
        tax: Number,
        error_code: String,
        error_description: String,
        error_source: String,
        error_step: String,
        error_reason: String,
        acquirer_data: Object,
        created_at: Date,
        refundRequired: {
            type: Boolean,
            default: false
        },
        refundReason: {
            type: String,
            default: ''
        },
        refundType: {
            type: String,
            default: 'PTH'
        },
        shorturl: String,
        longurl: String,
        fees: Number,
        purpose: String,
        buyer: String,
        buyer_name: String,
        buyer_phone: String,
        payment_request_id: String,
        payment_id: String,
        mac: String
    },
    { timestamps: true },
    { collection: 'payments' }
);

module.exports = mongoose.model('payments', PaymentSchema);
