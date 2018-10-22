const express = require("express");
const Post = require("../model/post.js");
const CrawledPost = require('../model/crawledPost.js')
const bodyParser = require('body-parser');
const multer = require('multer')();

let router = express.Router()

router.use(bodyParser.urlencoded({extended: true}))

router.post('/origin', multer.none(), function(req, res){
    
    let {from, to, keywords} = req.body
    
    if(keywords){
        //console.log(keywords.split(',').join('|'))
        let wordFilter = new RegExp(keywords.split(',').join('|'), 'g')
        Post.find({
            message: wordFilter,
            linkText: wordFilter,
            created:{ 
                $gte: new Date(from),
                $lte: new Date(to)
            }
        }, callback)
    }else{
        Post.find({
            created:{ 
                $gte: new Date(from),
                $lte: new Date(to)
            }
        }, callback)
    }
    
    function callback(err, data){
        if(err) throw err;
        //console.log(data)
        res.send(data)
    }

})

router.post('/crawled', multer.none(), function(req, res){
    let {from, to, keywords} = req.body
    
    if(keywords){
        //console.log(keywords.split(',').join('|'))
        let wordFilter = new RegExp(keywords.split(',').join('|'), 'g')
        CrawledPost.find({
            message: wordFilter,
            linkText: wordFilter,
            created:{ 
                $gte: new Date(from),
                $lte: new Date(to)
            }
        }, callback)
    }else{
        CrawledPost.find({
            created:{ 
                $gte: new Date(from),
                $lte: new Date(to)
            }
        }, callback)
    }
    
    function callback(err, data){
        if(err) throw err;
        //console.log(data)
        res.send(data)
    }
})


module.exports = router