const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var InvoiceSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectID,
            ref: 'users',
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        events: [String],
        isPaid: {
            type: Boolean,
            default: false
        },
        hasIssues: {
            type: Boolean,
            default: false
        },
        isApproved: {
            type: Boolean,
            default: false
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectID,
            ref: 'users'
        }
    },
    { timestamps: true },
    { collection: 'invoices' }
);

InvoiceSchema.index({ user: 1 });

InvoiceSchema.statics.findByUser = function (user_id) {
    return this.find({ user: user_id });
};

module.exports = mongoose.model('invoices', InvoiceSchema);
