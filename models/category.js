var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var categorySchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        desc: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
