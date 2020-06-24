const crypto = require("crypto");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  hidden: { type: Boolean, default: false },
  refreshToken: { type: String },
  twoFactorAuthenticationEnabled: { type: Boolean, default: false },
  custom: { type: Object, default: {} },
  metadata: {
    registeredAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
  },
  passwordResetToken: String,
  passwordResetExpiration: Date,
});
userSchema.methods.print = function () {
  console.log(this);
};

userSchema.methods.generatePasswordResetToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Save to the user the encrypted version
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpiration = Date.now() + 15 * 60 * 60 * 1000;
  this.save();

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
