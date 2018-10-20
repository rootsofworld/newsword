let waitingList

const urlencode = require('urlencode');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk')
const axios = require('axios-https-proxy-fix')
const rp = require('request-promise');
const util = require('util')
const json2csv = require('json2csv')
const csv = require('csvtojson')
const path = require('path')
/////////////////// 網頁解析與文字處理相關 /////////////////////
const wordProcesser = require('./util/wordprocesser.js')
const getAnonymous = require('./util/getAnonymous.js')
const hasDoubtfulImageText = require('./util/hasDoubtfulImageText.js')
const wordIntersectRatio = require('./util/wordIntersectRatio.js')
const NewsParser = require('./util/newsparser.js')
const stopwords = fs.readFileSync('../config/stopwords.txt','utf8')
/////////////////////////////////////////////////////////////////
//const batchTask = require('./batchTask.js');
const target = require('../config/pageList.json')
var pageMap = new Map()
target.targets.forEach(page => {
    pageMap.set(page.name, page)
})
//console.log(pageMap.entries())

const input = '../data/3-pack/' + process.argv[2]; //input file name

var fsFuncList = ['readFile', 'writeFile', 'readdir', 'mkdir'];
const {readFile, writeFile, readDir, mkDir} = ((funcs) => {
    var funcSet = {}
    funcs.forEach(func => {
        funcSet[func] = util.promisify(fs[func])
    });
    return funcSet;
})(fsFuncList);

//console.log(pagelist)
const wp = new wordProcesser()

var user_agent = ["Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",  
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36",  
"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0" , 
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/537.75.14",  
"Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64; x64; Trident/6.0)",
'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'
] 

var option = {
    method: 'get',
    headers: {
        'User-Agent' : user_agent[Number((Math.random() * user_agent.length).toFixed(0))]
    },
    timeout: 30000,
    validateStatus: function (status) {
        return status >= 200 && status < 300 || status === 404; // default
    }
}

console.log(input)


csv().fromFile(input)
        .then( async list => {
            var map = new Map()
            list = list.sort((d1, d2) => {
                var t1 = new Date(d1["Created"].slice(0, -4))
                var t2 = new Date(d2["Created"].slice(0, -4))
                return t2.getMilliseconds() - t1.getMilliseconds()
            })
            //console.log(list.slice(0, 9))
            for(let i = 0; i < list.length; i++){
                var dataPoint = await crawl(list[i])
                //console.log(dataPoint)
                if(dataPoint){
                    if(!map.has(dataPoint["Name"])){
                        map.set(dataPoint["Name"], new Array(dataPoint))
                        console.log(map.get(dataPoint["Name"]))
                    }else{
                        console.log("Name: " + dataPoint["Name"])
                        var arr = map.get(dataPoint["Name"])
                        arr.push(dataPoint)
                        map.set(dataPoint["Name"], arr)
                    }
                }
            } 
            var data = []
            for(dp of map.values()){
                data = data.concat(dp)
            }
            var dataString = JSON.stringify(data)
            fs.writeFile(process.argv[2].split('.')[0] + "-out.json", dataString, 'utf8', (err) => {
                if(err) throw err;
                console.log("Data Size: " + data.length)
            })
        })



async function crawl(post){
    
    if(!pageMap.has(post["Name"])){
        console.error(chalk.red("Can't find " + post["Name"] + "in the pageList.config"));
    }
    if(post['Type'] !== 'Link') { return false };

    var url = post['Link'];
    //console.log(url)
    //handle Special case: chinese in url
    var chineseInURL = /pnn.pts.org.tw|www.cmmedia.com.tw/g
    if(chineseInURL.test(post.link)){
        var head = /https:\/\/|http:\/\//g
        var str = post.link
        var headMatched = head.exec(str)
        str = str.slice(head.lastIndex)
        url = headMatched[0] + str.split('/').map((substr) => urlencode(urlencode.decode(substr))).join('/')
    }
    /////////////
    try{
        //await sleep(500)
        var response = await axios(url, option)
        var parser = new NewsParser(response.data, pageMap.get(post["Name"]).rules)

        //Do some text processing things
        //post-article Similarity
        post.article = parser.getArticle()
        //if(post.article === "") console.log('Oops')
        //console.log(post['Link Text'])
        var postKeywords = post.postKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post['Message']), 1000).map( obj => obj.word), stopwords);
        var articleKeywords = post.articleKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post['article']), 1000).map( obj => obj.word), stopwords);
        post.similarity = wordIntersectRatio( postKeywords, articleKeywords );

    }catch(err){
        
        console.error(chalk.red('\n'+err))
        //console.error(chalk.red(err))
    }
    
    //console.log(`\n${post["Name"]} is Done`)
 
    return post
        
}

//crawl(process.argv[2])
