const express = require('express')
const router = express.Router()

const fs = require('fs');
const path = require("path");

const bcrypt = require('bcrypt');
const saltRounds = 15;

// JWT
const jwt = require('jsonwebtoken');
const { verifyToken, generateRefreshToken, generateJWT } = require('../shared/auth.js');

const UserModel = require('../models/UserModel.js');
const MongooseRepository = require('../data/MongooseRepository.js');
const UserRepo = new MongooseRepository({ Model: UserModel });

router.post('/register', async (req, res) => {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(req.body.password, salt)

    if (await UserRepo.find({ username: req.body.username }, false)) {
        res.status(401).send({ error: "username is not available" })
        return;
    }

    const user = await UserRepo.create({ username: req.body.username, password: hash });
    const token = await generateJWT({ user }, { subject: req.body.username });
    res.status(201).set("Authorization", `Bearer ${token}`).send();
});

router.post('/login', async (req, res) => {
    try {
        var user = await UserRepo.find({ username: req.body.username }, false);
        var pass = await bcrypt.compare(req.body.password, user.password);
        if (pass) {
            user.metadata.lastLogin = Date.now();
            user.refreshToken = await generateRefreshToken();
            await UserRepo.update(user, user);
            const token = await generateJWT({ user }, { subject: req.body.username });
            res.status(200).set("Authorization", `Bearer ${token}`).send()
        } else {
            res.status(401).send({ error: "invalid username/password" })
        }
    } catch (err) {
        console.log(err)
        res.status(401).send({ error: "invalid username/password" });
    }
})

router.post('/refresh', async (req, res) => {
    try {
        if (req.body.refreshToken == "" || req.body.refreshToken == undefined || req.body.refreshToken == null) {
            throw "invalid username/refreshtoken";
        }
        var user = await UserRepo.find({
            refreshToken: req.body.refreshToken,
            username: req.body.username
        }, false)

        if (!user) {
            throw "invalid username/refreshtoken";
        }
        user.refreshToken = await generateRefreshToken(); //decommission refreshtoken for a new one
        await UserRepo.update(user, user);

        const token = await generateJWT({ user }, { subject: req.body.username });
        res.status(200).set("Authorization", `Bearer ${token}`).send()
    } catch (err) {
        console.log(err)
        res.status(401).send({ error: "invalid username/refreshtoken" });
    }
})

router.delete('/revoke', verifyToken, async (req, res) => { // log out completely
    var user = await UserRepo.find({ username: req.user.username }, false)
    if (user.refreshToken) {
        user.refreshToken = "";
        await UserRepo.update(user, user);
        user.set('password', undefined)
        user.set('__v', undefined)
        res.status(200).send()
    }
    res.status(200).send()
})

router.delete('/revoke/all', verifyToken, async (req, res) => { // emergency stop
    var users = await UserRepo.find()
    users.forEach(async user => {
        if (user.refreshToken) {
            user.refreshToken = "";
            await UserRepo.update(user, user);
        }
    });
    res.status(200).send()
})

module.exports = router