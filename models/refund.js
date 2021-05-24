const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RefundSchema = new Schema(
    {
        id: String,
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

RefundSchema.statics.findByRefundID = function (id) {
    return this.findOne({ id: id });
};

module.exports = mongoose.model('refunds', RefundSchema);
