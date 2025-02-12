const express = require('express');
const router = express.Router();
const { distGoogleMap } = require('../controllers/distance.googleMap.controller');

router.route('/').post(distGoogleMap);

module.exports = router;