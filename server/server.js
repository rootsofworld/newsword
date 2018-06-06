const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const Postlist = require('./model/postlist.js');
const bodyParser = require('body-parser');
const csv = require('csvtojson');
const fileUpload = require('express-fileupload')
//const upload = require('multer')({dest:"./uploads/"}); 
const {matchTopic, matchAllFile} = require('../lib/matchTopic.js');
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

app.get('/dashboard', function(req, res){
    res.render('dashboard',{
        topic:'年改\n年金\n軍警\n軍公教',
        keywords:'年金改革待遇不如軍\n年改待遇不如軍\n軍人\n退休警消\n警消\n退警\n退消\n警眷\n軍警\n警方\n警力\n軍公教\n警消不服從\n警察不服從\n紅漆\n降半旗\n灑冥紙\n撒冥紙\n肢體衝突\n流血衝突\n包圍媒體\n毆打記者\n電視台記者\n攝影記者\n花蓮退休員警\n兩天一夜\n萬人大遊行\n總統\n總統府\n蔡政府\n蔡英文\n林萬億\n段宜康\n耿繼文\n曾永權\n林德福\n李彥秀\n曾銘宗\n盧秀燕\n陳學聖\n陳慶財\n彭昌盛\n甘雯\n丁守中\n張顯耀\n鍾小平\n林國春\n蘇嘉全\n邱國正\n許俊逸\n陳弘毅\n退休消防總會\n退休警察總會\n退休公教總會\n中華民國退警總會理事長\n人形推車\n監察院\n行政院\n立法院\n夜宿立法院\n軍人年改\n軍改\n軍人年改修法\n年金改革\n反年改\n年改新制\n年改修惡\n年改惡法\n公教警消退撫新制\n公教警消年金改革法案\n七月一日\n七月\n脫鉤處理\n司法津貼\n雙偵查權地位\n陳情書\n杯葛\n夜問\n真砍殺，假改革'
    })
})

app.post('/data', async function(req, res){
    try{
        var data = await matchAllFile({
            topic: req.body.topic,
            keywords: req.body.keywords
        })
    }catch(err){
        console.error(err)
    }
    res.setHeader('Content-Type', 'application/json');
    res.json({data:data});
})


app.listen('9000',(err) => {
    if(err) throw err;
    console.log("Server is Running")
})