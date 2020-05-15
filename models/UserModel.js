const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    hidden: { type: Boolean, default: false },
    refreshToken: { type: String },
    custom: { type: Object, default: {} },
    metadata: {
        registeredAt: { type: Date, default: Date.now },
        lastLogin: { type: Date }
    }
});
userSchema.methods.print = function () { console.log(this) }

module.exports = mongoose.model('User', userSchema);