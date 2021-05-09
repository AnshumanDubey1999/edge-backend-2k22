var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        desc: {
            type: String,
            required: true
        },
        eventCode: {
            type: String,
            required: true,
            unique: true
        },
        eventPrice: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        discount: {
            type: Number,
            default: 0
        },
        combos: [],
        userMap: Map,
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category'
        },
        eventType: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
