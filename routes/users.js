var express = require('express');
var router = express.Router();

const userController = require('../controllers/userController');

//MIDDLEWARES
const sso = require('../middlewares/sso-decoder');
const Authenticate = require('../middlewares/auth');
const validateUser = require('../validations/user');

router.get('/login', sso.validate, userController.login);
router.post(
    '/register',
    Authenticate.isTemporary,
    validateUser.register,
    userController.register
);

module.exports = router;
