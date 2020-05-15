// JWT
const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");

const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

var publicKEY = "";
var privateKEY = "";
try {
  publicKEY = fs.readFileSync(
    path.resolve(__dirname, "../keys/public.key"),
    "utf8"
  );
  privateKEY = fs.readFileSync(
    path.resolve(__dirname, "../keys/private.key"),
    "utf8"
  );
} catch {
  console.log(
    chalk.red(
      "Error: Create a public.key and private.key of your RSA inside <root>/keys"
    )
  );
}
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const verifyOptions = {
      issuer: "nergy.space",
      subject: req.body.username,
      audience: "https://nergy.space",
      expiresIn: "2h",
      algorithm: "RS256",
    };
    jwt.verify(token, publicKEY, verifyOptions, (err, payload) => {
      if (err) {
        return res.sendStatus(403);
      }
      delete payload.user.password;
      delete payload.user.__v;
      req.user = payload.user;
      next();
    });
  } catch (err) {
    res.sendStatus(401);
  }
};

const generateJWT = async (
  payload,
  { subject, audience = "https://nergy.space", expiresIn = "2h" }
) => {
  if (payload.user) {
    payload.user.set("__v", undefined);
    payload.user.set("password", undefined);
  }
  const signOptions = {
    issuer: "nergy.space",
    subject: subject,
    audience: audience,
    expiresIn: expiresIn,
    algorithm: "RS256",
  };
  return jwt.sign(payload, privateKEY, signOptions);
};

const generateRefreshToken = async () => {
  return v4();
};

module.exports = { verifyToken, generateRefreshToken, generateJWT };
