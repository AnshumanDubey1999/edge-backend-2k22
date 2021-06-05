const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TokenSchema = new Schema(
    {
        token: {
            type: String,
            required: true
        }
    },
    { timestamps: true },
    { collection: 'tokens' }
);

TokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 10 });

module.exports = mongoose.model('tokens', TokenSchema);
