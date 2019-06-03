const rp = require('request-promise');
const chalk = require('chalk')
const fs = require('fs')
const urlencode = require('urlencode')
const axios = require('axios')
const NewsParser = require('../server/util/newsparser.js')

var link = process.argv[2]

var PNN_URL = /pnn.pts.org.tw/g
var url = link
if(PNN_URL.test(link)){
    var head = /https:\/\/|http:\/\//g
    var str = link
    var headMatched = head.exec(str)
    str = str.slice(head.lastIndex)
    url = headMatched[0] + str.split('/').map((substr) => urlencode(urlencode.decode(substr))).join('/')
}

let option = {
    url: url,
    method: "GET",
    headers:{
        'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
    }
}

const rules = {
    "article": "#artbody p",
    "images": ""
}


axios(option)
    .then((data) => {
        const noscriptFilter = /<noscript.+<\/noscript>/g
        data.data.replace(/<noscript.+<\/noscript>/g, "")
        let parser = new NewsParser(data.data, rules)
        console.log(`Article Content : ${parser.getArticle()}`)
        console.log(`Image Description : ${parser.getImagesText()}`)
        
    }).catch( err => {
        console.log(chalk.greenBright(`Error occured with this URL : ${url}`))
        throw err
    })
    

