var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        subtitle: String,
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
            required: true,
            enum: ['INTRA', 'EDGE']
        },
        club: {
            type: String,
            required: true,
            enum: [
                'curbrain',
                'cybercrusade',
                'rrc',
                'ciic',
                'createit',
                'geekdesign',
                'elevation',
                'foodforfun',
                'newron',
                'infocus'
            ]
        },
        rules: String,
        contacts: []
    },
    { timestamps: true }
);

eventSchema.index({ eventCode: 1 });

eventSchema.statics.getEventByCode = function (code) {
    return this.findOne({ eventCode: code }).populate('category');
};

eventSchema.statics.getEventByClub = function (club) {
    return this.find({ club: club });
};

eventSchema.statics.getEventTitles = function (codes) {
    return this.find({ eventCode: { $in: codes } }).select(['title']);
};

eventSchema.statics.findByEventCode = function (code) {
    return this.findOne({ eventCode: code });
};

eventSchema.statics.findAllByEventCode = function (codes) {
    return this.find({ eventCode: { $in: codes } });
};

eventSchema.statics.getAllEvents = function () {
    return this.find({}).populate('category');
};

eventSchema.statics.getEventsByQuery = function (query) {
    var isActive = query.isActive;
    var category = query.category;
    var discount = query.discount;
    var eventPrice = query.eventPrice;
    var eventType = query.eventType;
    var combos = query.combos;
    var filter = [];

    if (isActive) filter.push({ isActive: isActive });
    if (category) filter.push({ category: category });
    if (eventType) filter.push({ eventType: eventType });
    if (discount) filter.push({ discount: { $gte: discount } });
    if (eventPrice) filter.push({ eventPrice: { $lte: eventPrice } });
    if (combos) filter.push({ 'combos.0': { $exists: true } });

    console.log(filter);

    // return this.find({}).populate('category');

    return this.find({ $and: filter }).populate('category');
};

module.exports = mongoose.model('Event', eventSchema);
