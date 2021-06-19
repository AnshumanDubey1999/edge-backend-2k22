const SponsorSchema = require('../models/sponsor');

require('dotenv').config();

exports.all = async (req, res) => {
    try {
        // const limit = 20;
        // const skip = (Number(req.query.page) - 1) * 20;
        const sponsors = await SponsorSchema.find(); //.skip(skip).limit(limit);
        res.status(200).json({
            success: true,
            sponsors: sponsors
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

//ADMIN CONTROLLERS
exports.add = async (req, res) => {
    try {
        const sponsor = await SponsorSchema.create({
            name: req.body.name,
            tag: req.body.tag,
            link: req.body.link,
            order: req.body.order
        });
        res.status(200).json({
            success: true,
            sponsor: sponsor
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.addImage = async (req, res) => {
    // console.log(req.file.filename);
    try {
        res.status('200').json({
            sucess: true
        });
    } catch (e) {
        res.status('200').json({
            sucess: false,
            error: String(e)
        });
    }
};

exports.update = async (req, res) => {
    try {
        const sponsor = await SponsorSchema.findByIdAndUpdate(
            req.body._id,
            {
                name: req.body.name,
                tag: req.body.tag,
                link: req.body.link,
                order: req.body.order
            },
            { new: true }
        );
        res.status(200).json({
            success: true,
            sponsor: sponsor
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const sponsor = await SponsorSchema.findByIdAndDelete(req.query._id);
        res.status(200).json({
            success: true,
            sponsor: sponsor
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: error.message
        });
    }
};
