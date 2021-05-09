const { fileLoader } = require('ejs');
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

categorySchema.statics.getCategories = function () {
    return this.find({});
};

categorySchema.statics.getCategoryById = function (id) {
    if (!id) id = '';
    return this.find({ _id: id });
};

module.exports = mongoose.model('Category', categorySchema);
