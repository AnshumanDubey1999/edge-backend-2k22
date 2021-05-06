var express = require('express');
var router = express.Router();

const invoiceController = require('../controllers/invoiceController');

//MIDDLEWARES
const Authenticate = require('../middlewares/auth');
const validateInvoice = require('../validations/invoice');
const upload = require('../middlewares/s3');



router.get(
    '/',
    Authenticate.isLoggedIn,
    validateInvoice.myInvoices,
    invoiceController.myInvoices
);

router.post(
    '/create',
    Authenticate.isLoggedIn,
    validateInvoice.createInvoice,
    invoiceController.createInvoice
);

router.get(
    '/:invoice_id/view',
    Authenticate.isLoggedIn,
    validateInvoice.viewInvoice,
    invoiceController.viewInvoice
);

router.post(
    '/:invoice_id/update',
    Authenticate.isLoggedIn,
    validateInvoice.createInvoice,
    invoiceController.createInvoice
);

router.post(
    '/:invoice_id/pay',
    Authenticate.isLoggedIn,
    validateInvoice.payInvoice,
    invoiceController.validatePayment,
    upload.single('bill'),
    invoiceController.payInvoice
);

//ADMIN ONLY
router.get(
    '/allInvoices',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateInvoice.allInvoices,
    invoiceController.allInvoices
);

router.post(
    '/approveInvoice',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateInvoice.approveInvoice,
    invoiceController.approveInvoice
);

router.post(
    '/deleteInvoice',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    validateInvoice.deleteInvoice,
    invoiceController.deleteInvoice
);

module.exports = router;
