const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        stream: String,
        year: String,
        instituteName: String,
        intraInvoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        contact: {
            type: String,
            required: true,
            unique: true
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        registeredEvents: [String]
    },
    { timestamps: true },
    { collection: 'users' }
);

UserSchema.index({ email: 1 });

UserSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email });
};

module.exports = mongoose.model('users', UserSchema);
