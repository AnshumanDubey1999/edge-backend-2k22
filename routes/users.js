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
router.get('/myProfile', Authenticate.isLoggedIn, userController.myProfile);

router.post(
    '/updateProfile',
    Authenticate.isLoggedIn,
    validateUser.updateProfile,
    userController.updateProfile
);

//ADMIN ROUTES
router.get(
    '/allUsers',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateUser.allUsers,
    userController.allUsers
);
router.get(
    '/viewUser',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateUser.viewUser,
    userController.viewUser
);
router.post(
    '/deleteUser',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateUser.deleteUser,
    userController.deleteUser
);

router.get(
    '/toCSV',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateUser.toCSV,
    userController.toCSV
);

router.get(
    '/saveAdminToken',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    userController.saveAdminToken
);

router.get(
    '/fetchAdminToken',
    validateUser.fetchAdminToken,
    userController.fetchAdminToken
);

module.exports = router;
