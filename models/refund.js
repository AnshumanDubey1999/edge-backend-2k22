const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RefundSchema = new Schema(
    {
        refundID: String,
        entity: String,
        amount: Number,
        receipt: String,
        currency: String,
        payment_id: String,
        notes: Object,
        acquirer_data: Object,
        created_at: Date,
        batch_id: String,
        status: String,
        speed_processed: String,
        speed_requested: String
    },
    { timestamps: true },
    { collection: 'refunds' }
);

RefundSchema.statics.findByRefundID = function (refundID) {
    return this.findOne({ refundID });
};

module.exports = mongoose.model('refunds', RefundSchema);
