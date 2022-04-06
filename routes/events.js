/* eslint-disable prettier/prettier */
var express = require('express');
var eventContoller = require('../controllers/eventController');
var router = express.Router();
var Authenticate = require('../middlewares/auth');
const upload = require('../middlewares/s3').event_upload;
const logo_upload = require('../middlewares/s3').logo_upload;
const imageValidator = require('../validations/event_validation_schema').addImage;

//user and admin
router.get('/', eventContoller.getEvents);
router.get('/:eventCode', eventContoller.getEventByCode);


//admin
router.post('/add', Authenticate.isLoggedIn,  Authenticate.isAdmin, eventContoller.addEvent);
router.post(
    '/addImage', 
    Authenticate.isLoggedIn,  
    Authenticate.isAdmin, 
    imageValidator, 
    upload.single('poster'), 
    eventContoller.addImage
);
router.post(
    '/addLogo', 
    Authenticate.isLoggedIn,  
    Authenticate.isAdmin, 
    imageValidator, 
    logo_upload.single('logo'), 
    eventContoller.addLogo
);
router.put('/edit', Authenticate.isLoggedIn,  Authenticate.isAdmin, eventContoller.updateEvent);
router.delete('/delete', Authenticate.isLoggedIn,  Authenticate.isAdmin, eventContoller.delete);

module.exports = router;
