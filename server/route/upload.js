const express = require('express');
const fileUpload = require('express-fileupload');
const Post = require('../model/post.js');
const csv = require('csvtojson');
const fs = require('fs');
const path = require('path')


let router = express.Router()

router.post('/', fileUpload(), function(req, res){
            if(!req.files){
                return res.status(400).send('Upload Failed')
            }
            
            let file = req.files.file.data.toString()
            let id_list = []
            csv()
                .fromString(file)
                .then( (rows) => {
                    var count = rows.length
                    rows.map(row => {
                        return {
                            name: row["Name"],
                            sizeAtPosting: row["Size at Posting"],
                            created: row["Created"].split(' ').slice(0,-1).join(' '),
                            type: row["Type"],
                            likes: row["Likes"],
                            comments: row["Comments"],
                            shares: row["Shares"],
                            love: row["Love"],
                            wow: row["Wow"],
                            haha: row["Haha"],
                            sad: row["Sad"],
                            angry: row["Angry"],
                            thankful: row["Thankful"],
                            videoShareStatus: row["Video Share Status"],
                            postViews: row["Post Views"] ,
                            totalViews: row["Total Views"],
                            totalViewsForAllCrossposts: row["Total Views for all CrossPosts"],
                            url: row["URL"],
                            message: row["Message"],
                            link: row["Link"],
                            finalLink: row["Final Link"],
                            linkText: row["Link Text"],
                            score: row["Score"],
                            crawlState: "Waiting" // Waiting | Success | Failed
                        }
                    }).forEach( row => {
                        //check whether data already exist in DB
                        Post.find({name: row.name, created: row.created}, function(err, post){
                            if(err) return handleError(err)
                            
                            //if Doesn't exist, create it
                            if(!post.length) {
                                Post.create(row, function(err, post){
                                    if(err) return handleError(err)
                                    console.log("_ID: " + post._id)
                                    id_list.push(post._id)
                                    console.log(post.name + "-" + post.created + " saved in Posts")
                                    count--
                                    if(count === 0) saveWaitingList()
                                })
                            }else if(post[0].crawlState === "Failed"){
                                console.log(`${post[0]._id}-${post[0].created} was crawl Failed, now try it again.`)
                                id_list.push(post[0]._id)
                                count--
                                if(count === 0) saveWaitingList()
                            }else{
                                count--
                                if(count === 0) saveWaitingList()
                                console.log(row.name + "-" + row.created + " is Already Exist")
                            }
                        })
                    })
                })

            function saveWaitingList(){
                if(id_list.length === 0){
                    console.log("[Warning] Don't have data to save")
                    return;
                }
                console.log("Saving waiting list...")
                fs.writeFile(`${path.resolve('_Waiting')}/${Date.now()}.txt`, id_list.join('/n'), 'utf8', function(err, data){
                    if(err) console.log(err)
                    //console.log(id_list)
                    console.log(`Rows Count: ${id_list.length}`)
                })
            }
            
            //console.log(req.files.file.data.toString())
            res.send(req.files.file.name + " uploaded confirm")
        })

//TODO: 
// data does not match the schema
// data already exist
function handleError(err){
    console.log(err)
    return err
}





module.exports = router