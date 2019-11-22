var router = require('express').Router();
var controller = require('./chatroom.controller');
var authMiddleware = require('../../middlewares/auth');

router.use('/creation', authMiddleware);
router.use('/list', authMiddleware);
router.use('/recommend', authMiddleware);
router.use('/exit/:cr_id', authMiddleware);
router.use('/entrance/:cr_id', authMiddleware);

router.get('/search/:keyword', controller.searchWord);
router.post('/creation', controller.creation);
router.get('/list', controller.getList);
router.post('/exit/:cr_id', controller.exit);
router.get('/log/:cr_id', controller.getLog);
router.get('/participants/:cr_id', controller.getParticipants);
router.get('/recommend', controller.recommend);
router.post('/entrance/:cr_id', controller.entrance);
module.exports = router;