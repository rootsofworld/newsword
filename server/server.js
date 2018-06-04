const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const Postlist = require('./model/postlist.js');
const bodyParser = require('body-parser');
const csv = require('csvtojson');
const fileUpload = require('express-fileupload')
//const upload = require('multer')({dest:"./uploads/"}); 
const db = mongoose.connect("mongodb://sf:105753037@140.119.164.168:27017/admin")

////////// utils //////////

function hashCode(str) {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };




///////////////////////////

const app = express()
app.set('views', './template')
app.set('view engine', 'hbs')
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/public'))
app.use('/upload', fileUpload())

app.post('/upload', function(req, res){
    if (!req.files){
        return res.status(400).send('No files were uploaded.');
    }
    //single file
    if(typeof req.files.upload === "object"){
        var file = req.files.upload
        var filehash = hashCode(file.name)
        try{
            fs.mkdirSync(`/uploads/tmp-${filehash}`)
        }catch(err){
            throw err
        }
        file.mv(`/uploads/tmp-${filehash}/${file.name}`).then( err => {
            if(err) throw new Error('File movement has some problem')
            console.log('File uploaded : ' + file.name)
        })
    }else{ // multiple files
        var files = req.files.upload.map(async (file) => {
            var csvStr = file.data.toString();
            return await csv().fromString(csvStr).then((json) => json)
        })
        
        var filehash = hashCode(files[0].name)
        fs.mkdirSync(`/uploads/tmp-${filehash}`)
        for(file in files){
            file.mv(`/uploads/tmp-${filehash}/${file.name}`).then( err => {
                if(err) throw new Error('File movement has some problem')
                console.log('File uploaded : ' + file.name)
            })
        }
    }
    res.send(files)

    /*var test = new Postlist({pagename:req.body.pagename, pageid:req.body.pageid})
    test.save().then((err, data) => {
        if(err) {
            console.error('Wrong data type')
            throw new Error('Wrong data type')
        }
        res.write(data)
    })*/
})

app.get('/upload', function(req, res){
    res.render('upload')
})

app.get('/data', function(req, res){
    res.write('here is some data\n')
    res.end('ok')
})

app.get('/dashboard', function(req, res){
    res.render('dashboard')
    res.end('This Will Be a Dashboard :)')
})


app.listen('9000',(err) => {
    if(err) throw err;
    console.log("Server is Running")
})