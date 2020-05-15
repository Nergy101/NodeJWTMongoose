const express = require('express')
const router = express.Router()

const rateCheck = require("../shared/ratelimiter.js");
const { verifyToken } = require('../shared/auth.js');

router.use(verifyToken, rateCheck); // router middleware

router.get('/', async (req, res) => {
    res.status(200).send({ user: req.user });
})

module.exports = router;