const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createCategory, getCategories, getAllCategories, updateCategory, deleteCategory,
  createFeedingRecord, getMyFeedingRecords, updateFeedingRecord, deleteFeedingRecord
} = require('../controllers/dietController');

// User: browse active categories
router.get('/categories', protect, getCategories);

// Admin: full category management
router.get('/categories/all', protect, admin, getAllCategories);
router.post('/categories', protect, admin, createCategory);
router.put('/categories/:id', protect, admin, updateCategory);
router.delete('/categories/:id', protect, admin, deleteCategory);

// User: feeding records
router.route('/records')
  .get(protect, getMyFeedingRecords)
  .post(protect, createFeedingRecord);

router.route('/records/:id')
  .put(protect, updateFeedingRecord)
  .delete(protect, deleteFeedingRecord);

module.exports = router;