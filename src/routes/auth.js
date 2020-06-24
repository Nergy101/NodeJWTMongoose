const crypto = require("crypto");
const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const saltRounds = 15;
const twoFactor = require("node-2fa");

const sendMail = require("../shared/email");

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
  const email = req.body.email.trim();

  if (await UserRepo.find({ username }, false)) {
    res.status(401).send({ error: "username is not available" });
    return;
  }

  const user = await UserRepo.create({ username, password: hash, email });
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

router.post("/forgotPassword", async (req, res) => {
  // Get user based on email address
  const email = req.body.email;
  const user = await UserRepo.find({ email }, false);

  if (!user) return res.status(400).json({ error: "Invalid email address! " });

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();

  // Send email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/auth/resetPassword/${resetToken}`;

  try {
    await sendMail({
      to: email,
      subject: "Password reset",
      text: `Forgot your password? Submit a PATCH request with your new password to ${resetURL}\nIf you didn't forget your password, please ignore this email!`,
    });
  } catch (err) {
    // Remove created token if email was not sent
    if (user) {
      await UserRepo.update(user, {
        passwordResetToken: undefined,
        passwordResetExpiration: undefined,
      });
    }

    return res.status(401).send({
      error:
        "User does not exist or email could not be sent! Please try again.",
    });
  }

  res.status(204).json();
});

router.patch("/resetPassword/:token", async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // Check token validity and expiration
  try {
    const user = await UserRepo.find(
      {
        passwordResetToken: hashedToken,
        passwordResetExpiration: { $gt: Date.now() },
      },
      false
    );

    if (!user) throw new Error("Invalid token");

    // Update password
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(req.body.password, salt);
    user.password = hash;
    user.passwordResetToken = null;
    user.passwordResetExpiration = null;

    // Log in user
    user.metadata.lastLogin = Date.now();
    user.refreshToken = await generateRefreshToken();
    await UserRepo.update(user, user);
    const token = await generateJWT({ user }, { subject: user.username });
    res.status(200).set("Authorization", `Bearer ${token}`).send();
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error });
  }
});

module.exports = router;
