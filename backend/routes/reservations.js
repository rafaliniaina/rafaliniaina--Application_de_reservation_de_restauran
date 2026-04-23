const router  = require('express').Router();
const ctrl    = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/',        ctrl.create);
router.get ('/mine',    ctrl.getMine);
router.delete('/:id',   ctrl.cancel);

module.exports = router;