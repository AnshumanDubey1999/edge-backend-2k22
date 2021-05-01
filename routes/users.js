var express = require('express');
var router = express.Router();

const userController = require('../controllers/userController');

//MIDDLEWARES
const sso = require('../middlewares/sso-decoder');
const Authenticate = require('../middlewares/auth');

/* GET users listing. */
// eslint-disable-next-line no-unused-vars
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});
router.get('/login', sso.validate, userController.login);
router.post('/register', Authenticate.auth, userController.register);

module.exports = router;
