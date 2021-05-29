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
        }
    },
    { timestamps: true },
    { collection: 'payments' }
);

module.exports = mongoose.model('payments', PaymentSchema);
