const router  = require('express').Router();
const ctrl    = require('../controllers/ownerController');
const { protect, isOwner } = require('../middleware/auth');
const { upload }           = require('../config/multer');

router.use(protect, isOwner);

router.get   ('/restaurants',                  ctrl.getMyRestaurants);
router.post  ('/restaurants',                  upload.single('cover_image'), ctrl.create);
router.put   ('/restaurants/:id',              upload.single('cover_image'), ctrl.update);
router.delete('/restaurants/:id',              ctrl.remove);
router.get   ('/reservations',                 ctrl.getReservations);
router.put   ('/reservations/:id/status',      ctrl.updateResvStatus);
router.get   ('/stats',                        ctrl.getStats);

module.exports = router;