var mongoose = require('mongoose');

var blogSchema = new mongoose.Schema({
    title: String, // String is shorthand for {type: String}
    author: String,
    type: String,
    body: String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: { type: Boolean, default: false },
    meta: {
        upvotes: Number,
        downvotes: Number
    }
});
blogSchema.methods.print = function () { console.log(this) }
blogSchema.methods.findSameType = function (callback) { return this.model('Blog').find({ type: this.type }, callback) }

module.exports = mongoose.model('Blog', blogSchema);