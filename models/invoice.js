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
        type: {
            type: String,
            enum: ['INTRA', 'EDGE']
        },
        events: [String],
        eventData: [
            {
                title: String,
                subtitle: String,
                eventCode: String,
                eventPrice: Number
            }
        ],
        comboData: [
            {
                title: String,
                eventCode: String,
                eventPrice: Number,
                events: [
                    {
                        title: String,
                        eventCode: String
                    }
                ]
            }
        ],
        payment_id: {
            type: String,
            required: true
        },
        payment_details: {
            type: mongoose.Schema.Types.ObjectID,
            ref: 'payments',
            required: true
        },
        order_id: {
            type: String,
            required: true
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
