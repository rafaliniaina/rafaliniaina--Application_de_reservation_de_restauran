const router  = require('express').Router();
const ctrl    = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect, isAdmin);

router.get ('/stats',                       ctrl.getStats);
router.get ('/restaurants',                 ctrl.getAllRestaurants);
router.put ('/restaurants/:id/approve',     ctrl.approveRestaurant);
router.put ('/restaurants/:id/reject',      ctrl.rejectRestaurant);
router.delete('/restaurants/:id',           ctrl.deleteRestaurant);
router.get ('/reservations',                ctrl.getAllReservations);
router.put ('/reservations/:id/status',     ctrl.updateResvStatus);
router.get ('/users',                       ctrl.getAllUsers);
router.delete('/users/:id',                 ctrl.deleteUser);

module.exports = router;