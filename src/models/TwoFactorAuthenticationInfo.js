const twoFactor = require('node-2fa');
const mongoose = require('mongoose');
const TwoFactorAuthenticationInfoSchema = new mongoose.Schema({
    usernameHash: String,
    secret: String,
    uri: String,
    qr: String,
    activeToken: String,
});
TwoFactorAuthenticationInfoSchema.methods.print = function () { console.log(this) }

TwoFactorAuthenticationInfoSchema.methods.generateToken = function () {
    this.activeToken = twoFactor.generateToken(this.secret).token;
    return activeToken;
}

TwoFactorAuthenticationInfoSchema.methods.verifyToken = function (givenToken) {
    const result = twoFactor.verifyToken(this.secret, givenToken);
    if (result.delta === 0) {
        return true;
    } else {
        return false;
    }
}
module.exports = mongoose.model('TwoFactorAuthenticationInfo', TwoFactorAuthenticationInfoSchema);