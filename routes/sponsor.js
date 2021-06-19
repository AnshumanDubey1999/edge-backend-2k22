var express = require('express');
var router = express.Router();

const sponsorController = require('../controllers/sponsorController');

//MIDDLEWARES
const Authenticate = require('../middlewares/auth');
const validateSponsor = require('../validations/sponsor');
const upload = require('../middlewares/s3').sponsor_upload;
// const upload = require('../middlewares/s3').upload;

router.get('/', validateSponsor.all, sponsorController.all);

//ADMIN ONLY
router.post(
    '/add',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateSponsor.add,
    sponsorController.add
);

router.post(
    '/addImage',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateSponsor.addImage,
    upload.single('logo'),
    sponsorController.addImage
);

router.post(
    '/update',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateSponsor.update,
    sponsorController.update
);

router.post(
    '/delete',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateSponsor.delete,
    sponsorController.delete
);

module.exports = router;
