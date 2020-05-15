const express = require('express')
const router = express.Router()

const { verifyToken } = require('../shared/auth.js');

router.use(verifyToken); // router middleware

router.get('/', async (req, res) => {
    res.status(200).send({ user: req.user });
})

module.exports = router;