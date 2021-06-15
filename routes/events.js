/* eslint-disable prettier/prettier */
var express = require('express');
var eventContoller = require('../controllers/eventController');
var router = express.Router();
var Authenticate = require('../middlewares/auth');

//user and admin
router.get('/', eventContoller.getAllEvents);
router.get('/query',  eventContoller.getEvents);
router.get('/:eventCode', eventContoller.getEventByCode);


//admin
router.post('/add', Authenticate.isLoggedIn,  Authenticate.isAdmin, eventContoller.addEvent);

router.put('/edit', Authenticate.isLoggedIn,  Authenticate.isAdmin, eventContoller.updateEvent);
router.delete('/delete', Authenticate.isLoggedIn,  Authenticate.isAdmin, eventContoller.delete);

module.exports = router;
