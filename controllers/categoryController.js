/* eslint-disable no-undef */
const categoryModel = require('../models/category');
const categoryValidateSchema = require('../validations/category_validation_schema')
    .categorySchema;

exports.addCategory = (req, res) => {
    var newCategory = {};
    const { error } = categoryValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    newCategory = this.getSantizedCategoryObject(req);

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
        .getCategories()
        .then((categories) => {
            res.status(200).json({ categories });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
};

exports.getCategoryById = (req, res) => {
    const { error } = categoryValidateSchema.validate(req.params);
    if (error) {
        return res.status(400).json({ error });
    }
    const id = req.params.id;

    categoryModel
        .getCategoryById(id)
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

    const { error } = categoryValidateSchema.validate(req.body);
    if (error) {
        console.log(error);
        return res.status(400).json({ error });
    }

    updatedCategory = this.getSantizedCategoryObject(req);

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
                res.status(200).json(updatedDocument);
            } else {
                res.status(500).json({
                    msg: 'No document matches the provided query.'
                });
            }
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

    const { error } = categoryValidateSchema.validate(req.body);

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
