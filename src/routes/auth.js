const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const saltRounds = 15;
const twoFactor = require("node-2fa");

// JWT
const {
  verifyToken,
  generateRefreshToken,
  generateJWT,
} = require("../shared/auth.js");

const MongooseRepository = require("../data/MongooseRepository.js");
const UserModel = require("../models/UserModel.js");
const UserRepo = new MongooseRepository({ Model: UserModel });
const FAInfoModel = require("../models/TwoFactorAuthenticationInfo.js");
const FaInfoRepo = new MongooseRepository({ Model: FAInfoModel });

router.post("/register", async (req, res) => {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(req.body.password, salt);
  const username = req.body.username.trim();

  if (await UserRepo.find({ username }, false)) {
    res.status(401).send({ error: "username is not available" });
    return;
  }

  const user = await UserRepo.create({ username, password: hash });
  const token = await generateJWT({ user }, { subject: username });
  res.status(201).set("Authorization", `Bearer ${token}`).send();
});

router.post("/login", async (req, res) => {
  try {
    var user = await UserRepo.find({ username: req.body.username }, false);
    var pass = await bcrypt.compare(req.body.password, user.password);
    if (pass) {
      user.metadata.lastLogin = Date.now();
      user.refreshToken = await generateRefreshToken();
      await UserRepo.update(user, user);
      const token = await generateJWT({ user }, { subject: req.body.username });
      res.status(200).set("Authorization", `Bearer ${token}`).send();
    } else {
      res.status(401).send({ error: "invalid username/password" });
    }
  } catch (err) {
    console.log(err);
    res.status(401).send({ error: "invalid username/password" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    if (
      req.body.refreshToken == "" ||
      req.body.refreshToken == undefined ||
      req.body.refreshToken == null
    ) {
      throw "invalid username/refreshtoken";
    }
    var user = await UserRepo.find(
      {
        refreshToken: req.body.refreshToken,
        username: req.body.username,
      },
      false
    );

    if (!user) {
      throw "invalid username/refreshtoken";
    }
    user.refreshToken = await generateRefreshToken(); //decommission refreshtoken for a new one
    await UserRepo.update(user, user);

    const token = await generateJWT({ user }, { subject: req.body.username });
    res.status(200).set("Authorization", `Bearer ${token}`).send();
  } catch (err) {
    console.log(err);
    res.status(401).send({ error: "invalid username/refreshtoken" });
  }
});

router.delete("/revoke", verifyToken, async (req, res) => {
  // log out completely
  var user = await UserRepo.find({ username: req.user.username }, false);
  if (user.refreshToken) {
    user.refreshToken = "";
    await UserRepo.update(user, user);
    user.set("password", undefined);
    user.set("__v", undefined);
    res.status(200).send();
  }
  res.status(200).send();
});

router.delete("/revoke/all", verifyToken, async (req, res) => {
  // emergency stop
  var users = await UserRepo.find();
  users.forEach(async (user) => {
    if (user.refreshToken) {
      user.refreshToken = "";
      await UserRepo.update(user, user);
    }
  });
  res.status(200).send();
});

router.post("/2fa", verifyToken, async (req, res) => {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(req.user.username, salt);
  const { secret, uri, qr } = twoFactor.generateSecret({ hash });
  await FaInfoRepo.create({
    usernameHash: hash,
    secret,
    uri,
    qr,
    activeToken: undefined,
  });

  var user = await UserRepo.find({ username: req.user.username }, false);
  user.twoFactorAuthenticationEnabled = true;
  await UserRepo.update(user, user);

  // const faInfo = await FaInfoRepo.find({ usernameHash: hash }, false);
  // faInfo.verifyToken(givenToken)
  // await FaInfoRepo.update(faInfo, faInfo);

  // secret and qr should be send so that the user can fill these into an authenticator app
  // then the user sends his username (first gets JWT, verifies, fills req.user)
  // with the auth-code, then we verify it
  // ??????
  // if verify is True, then return 200 with jwt
  // if verify is False, then return 401 and revoke any jwt

  res.status(201).send({
    secret,
    uri,
    qr,
  });
});

module.exports = router;
