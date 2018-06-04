const mongoose = require('mongoose');
const Schema = mongoose.Schema

const postlist = new Schema({
    pagename: String,
    pageid: String,
    posts: [{
        created: Date,
        title: String,
        description: String,
        post: String,
        comments: Number,
        shares: Number,
        reactions: Number,
        url: String,
        link: String,
        article: String,
        keywords: Array
    }]
})

module.exports = mongoose.model('Postlist', postlist)