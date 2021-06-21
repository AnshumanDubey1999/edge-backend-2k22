const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var SponsorSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        tag: String,
        link: String,
        order: {
            type: Number,
            required: true
        }
    },
    { timestamps: true },
    { collection: 'sponsor' }
);

module.exports = mongoose.model('sponsor', SponsorSchema);
