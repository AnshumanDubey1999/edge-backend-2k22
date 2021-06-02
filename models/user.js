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
        registeredEvents: [String],
        avatar: String
    },
    { timestamps: true },
    { collection: 'users' }
);

UserSchema.index({ email: 1 });
UserSchema.index({ name: 'text' });

UserSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email });
};

UserSchema.statics.findUsersRegisteredToEvent = function (eventCode) {
    return this.find({ registeredEvents: { $in: eventCode } }).select([
        'name',
        'email'
    ]);
};

module.exports = mongoose.model('users', UserSchema);
