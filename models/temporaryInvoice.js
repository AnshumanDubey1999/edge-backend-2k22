const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TemporaryInvoiceSchema = new Schema(
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
        type: {
            type: String,
            enum: ['INTRA', 'EDGE']
        },
        events: [String],
        order_id: {
            type: String
        }
    },
    { timestamps: true },
    { collection: 'temporary_invoices' }
);

// TemporaryInvoiceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('temporary_invoices', TemporaryInvoiceSchema);
