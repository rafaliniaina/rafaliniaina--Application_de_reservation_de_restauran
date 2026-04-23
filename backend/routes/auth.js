const router = require('express').Router();
const auth   = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit   = require('express-rate-limit');

const limiter = rateLimit({ windowMs: 15*60*1000, max: 10,
  message: { success:false, message:'Trop de tentatives. Réessayez dans 15 minutes.' }
});

router.post('/register', limiter, auth.register);
router.post('/login',    limiter, auth.login);
router.get ('/me',       protect, auth.getMe);
router.put ('/profile',  protect, auth.updateProfile);

module.exports = router;