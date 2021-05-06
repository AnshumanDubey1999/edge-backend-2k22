// const express   = require("express")
// let router      = express.Router()
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');
// const path      = require('path')
// const auth      = require('../middlewares/auth')
// const { readFileSync } = require('fs');
// const { rejects } = require("assert")
// const { resolve } = require("path")

require('dotenv').config();
const s3 = new aws.S3({
    accessKeyId: process.env.AWSAccessKeyId,
    secretAccessKey: process.env.AWSSecretKey
});
const s3Storage = multerS3({
    s3: s3,
    bucket: 'edge-results',
    key: function (req, file, cb) {
        // console.log(file);
        const uid = req.params.invoice_id;
        cb(null, 'invoice/' + uid + '.jpg');
        // cb(null, file.originalname); //use Date.now() for unique file keys
    }
});

const upload = multer({
    limits: {
        fileSize: 10 * 1000 * 1000
    },
    fileFilter(req, file, cb) {
        file.originalname = file.originalname.toLowerCase();
        if (
            !file.originalname.endsWith('.jpg') &&
            !file.originalname.endsWith('.jpeg') &&
            !file.originalname.endsWith('.png')
        ) {
            return cb(new Error('File must be a Image'));
        }
        cb(undefined, true);
    },
    storage: s3Storage
});

module.exports = upload;
