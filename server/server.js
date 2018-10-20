const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
//const {matchTopic, matchAllFile} = require('../lib/matchTopic.js');
const db = mongoose.connect("mongodb://sf:105753037@140.119.164.168:27017/admin")
//Router
const uploader = require('./route/upload.js');
const query = require('./route/query.js')

const app = express()
app.set('views', './views')
app.set('view engine', 'hbs')
app.use(express.static(__dirname + '/public'))

app.use('/upload', uploader)

app.use('/data', query)


app.get('/', function(req, res){
    var visitorIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(visitorIP + " has visited!")
    res.render('dashboard')
})


app.listen(9000, function(){
    console.log("Server listen on 9000")
})