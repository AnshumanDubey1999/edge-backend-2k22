/* eslint-disable no-undef */
const categoryModel = require('../models/category');
const errorCodes = require('../error_codes.json');
const categoryValidateSchema = require('../validations/category_validation_schema').categorySchema;

exports.addCategory = (req, res) => {
    console.log(req.body);
    var newCategory = {};
    const { error, value } = categoryValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    newCategory = this.getSantizedCategoryObject(req);
    console.log(newCategory);

    categoryModel
        .create(newCategory)
        .then((category) => {
            res.status(200).json({ category });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.getAllCategories = (req, res) => {
    categoryModel
        .find({})
        .then((categories) => {
            res.status(200).json({ categories });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.getCategoryById = (req, res) => {
    const { error, value } = categoryValidateSchema.validate(req.params);
    if (error) {
        return res.status(400).json({ error });
    }
    const id = req.params.id;

    categoryModel
        .findOne({ _id: id })
        .then((category) => {
            res.status(200).json({ category });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.updateCategory = (req, res) => {
    var filter = null;
    var updatedCategory = {};
    const options = { new: true };

    console.log(req.body);
    const { error, value } = categoryValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    updatedCategory = this.getSantizedCategoryObject(req);
    console.log(updatedCategory);

    if (req.body.id) {
        filter = { _id: req.body.id };
    }

    if (!filter)
        return res.status(400).json({
            error:
                'request body must have an event code or id associated with it'
        });

    categoryModel
        .findOneAndUpdate(filter, updatedCategory, options)
        .then((updatedDocument) => {
            if (updatedDocument) {
                console.log(
                    `Successfully updated document: ${updatedDocument}.`
                );
            } else {
                console.log('No document matches the provided query.');
                res.status(500).json({
                    msg: 'No document matches the provided query.'
                });
            }
            res.status(200).json(updatedDocument);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.getSantizedCategoryObject = (req) => {
    var category = {};
    if (req.body.title) category['title'] = req.body.title;
    if (req.body.desc) category['desc'] = req.body.desc;

    if (category['title'])
        category['title'] = category['title']
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    if (category['desc'])
        category['desc'] = category['desc']
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    return category;
};

// eslint-disable-next-line no-unused-vars
exports.delete = (req, res, next) => {
    var id = req.body.id;
    var filter = {};
    if (id) {
        filter = { _id: id };
    }

    const { error, value } = categoryValidateSchema.validate(req.body);

    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    categoryModel
        .deleteMany(filter)
        .then((result) => {
            res.status(200).json({ result });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};
