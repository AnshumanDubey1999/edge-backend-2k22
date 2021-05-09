var express = require('express');
var eventContoller = require('../controllers/eventController');
var router = express.Router();

router.get('/', eventContoller.getAllEvents);
router.get('/query', eventContoller.getEvents);
router.get('/:eventCode', eventContoller.getEventByCode);
// router.get('/price', eventContoller.getEventByPrice);
// router.get('/disc', eventContoller.getEventByDiscount);
// router.get('/status', eventContoller.getEventByStatus);
// router.get('/category', eventContoller.getEventByCategory);

router.post('/add', eventContoller.addEvent);
// router.post('/register', eventContoller.registerUser);
router.put('/edit', eventContoller.updateEvent);
router.delete('/delete', eventContoller.delete);

module.exports = router;
