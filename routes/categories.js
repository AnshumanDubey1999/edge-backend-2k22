var express = require('express');
var categoryController = require('../controllers/categoryController');
var router = express.Router();

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.post('/add', categoryController.addCategory);

router.put('/edit', categoryController.updateCategory);
router.delete('/delete', categoryController.delete);

module.exports = router;
