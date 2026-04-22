const express = require('express');
const router = express.Router();
const {
  sendOTP,
  registerUser,
  loginUser,
  loginWithOTP,
  googleLogin,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOTP);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-otp', loginWithOTP);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
