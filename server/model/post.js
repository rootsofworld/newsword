const mongoose = require('mongoose');
const Schema = mongoose.Schema

//"紛絲專頁名稱","貼文時間","貼文連結","新聞標題","新聞大綱","LIKE","HAHA","ANGRY","SAD","LOVE","WOW","分享數","留言數","CT Score","貼文內容","原文內容","原文連結","貼文關鍵字","原文關鍵字","重疊字","重疊率"

//Name	Size at Posting	Created	Type	Likes	Comments	Shares	Love	Wow	Haha	Sad	Angry	Thankful	Video Share Status	Post Views	Total Views	Total Views for all Crossposts	URL	Message	Link	Final Link	Link Text	Score
const post = new Schema({
    name: String,
    sizeAtPosting: Number,
    created: Date,
    type: String,
    likes: Number,
    comments: Number,
    shares: Number,
    love: Number,
    wow: Number,
    haha: Number,
    sad: Number,
    angry: Number,
    thankful: Number,
    videoShareStatus: String,
    postViews: Number ,
    totalViews: Number,
    totalViewsForAllCrossposts: Number,
    url: String,
    message: String,
    link: String,
    finalLink: String,
    linkText: String,
    score: Number,
    crawlState: String,
    uploaded: Date
})


module.exports = mongoose.model('post', post)