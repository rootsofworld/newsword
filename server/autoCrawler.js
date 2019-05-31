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
const chokidar = require('chokidar')
const mongoose = require('mongoose')
/////////////////// 網頁解析與文字處理相關 /////////////////////
const wordProcesser = require('./util/wordprocesser.js')
const getAnonymous = require('./util/getAnonymous.js')
const hasDoubtfulImageText = require('./util/hasDoubtfulImageText.js')
const wordIntersectRatio = require('./util/wordIntersectRatio.js')
const NewsParser = require('./util/newsparser.js')
const stopwords = fs.readFileSync(path.resolve(__dirname, './config/stopwords.txt'), 'utf8')
/////////////////////////////////////////////////////////////////
const target = require('./config/pageList.json')
const db = mongoose.connect("mongodb://sf:105753037@140.119.164.168:27017/admin")
const CrawledPost = require('./model/crawledPost.js')
const Post = require('./model/post.js')


const wp = new wordProcesser()


var pageMap = new Map()
target.targets.forEach(page => {
    pageMap.set(page.name, page)
})


var user_agent = ["Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",  
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36",  
"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0" , 
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/537.75.14",  
"Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64; x64; Trident/6.0)",
'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'
] 

var options = {
    method: 'get',
    headers: {
        'User-Agent' : user_agent[Number((Math.random() * user_agent.length).toFixed(0))]
    },
    timeout: 30000,
    validateStatus: function (status) {
        return status >= 200 && status < 300 || status === 404; // default
    }
}


let watcher = null;
waitingListPath = path.resolve('./_Waiting');
if(fs.existsSync(waitingListPath)){
    watcher = chokidar.watch(waitingListPath, {
        persistent: true
    })
    watcher
        .on('add', function(path, stats){
            crawler.add(path)
        })
        .on('unlink', path => console.log(path + " was unlink"))
} else {
    console.log("_Waiting Directory not Existed, Now Create One")
    fs.mkdirSync('_Waiting');
}

failedListPath = path.resolve('./_Failed');
if(!fs.existsSync(failedListPath)){
    console.log("_Failed Directory not Existed, Now Create One")
    fs.mkdirSync('_Failed');
}



    
class Crawler {
    constructor(options, targets = []){
        this.options = options
        this.waitingList = targets
        this.crawling = false
    }
    
    add(path){
        console.log("Add File in waiting List")
        this.waitingList.push(path)
        if(!this.crawling){
            this.crawlFromList()
        }
    }
    
    //Only call when not crawling
    async crawlFromList(){
        this.crawling = true
        
        let errorList = []
        let list = this.waitingList.pop()
        let content = fs.readFileSync(list, 'utf8').split('/n')
        
        for(let i = 0; i < content.length; i++){
            
            let id = content[i]
            let result = await findAndCrawl(id, errorList)
            
            if(result){
                
                CrawledPost.create(result, function(err, data){
                    if(err) return handleError(err)
                    console.log(chalk.green("Create Crawledpost"))
                    
                    Post.update({_id: id}, { $set: { crawlState: "Success" } }, (err) => {
                        if(err) return handleError(err)
                    })
                    
                    console.log("_id: " + id + " has crawled and save in DB")
                })
                
            }else{
                console.log(chalk.red("NonLink type"))
            }
            
        }
        
        if(errorList.length !== 0){
            console.log("ERROR Count: " + errorList.length)
            fs.writeFileSync(path.resolve(`./_Failed/${Date.now()}.txt`), errorList.join('/n'))
        }
        
        fs.unlinkSync(list)
        
        if(this.waitingList.length > 0){
            console.log('Find another file. Keep Crawling...')
            this.crawlFromList()
        }else{
            this.crawling = false
            console.log('There is nothing waiting for crawling')
        }
        
        
    }
    
    //for testing
    async crawlOne(post){
        return await crawl(post)
    }
    
    
}

let crawler = new Crawler(options)
    
//Set directory watcher
console.log("Crawler is watching ...")


//Just turn some system function to promise-base
var fsFuncList = ['readFile', 'writeFile', 'readdir', 'mkdir'];
const {readFile, writeFile, readDir, mkDir} = ((funcs) => {
    var funcSet = {}
    funcs.forEach(func => {
        funcSet[func] = util.promisify(fs[func])
    });
    return funcSet;
})(fsFuncList);


async function crawl(post){
    
    if(!pageMap.has(post.name)){
        console.error(chalk.red("Can't find " + post.name + "in the pageList.config"));
        return false
    }
    if(post.type !== 'Link') { 
        return false
    };
    
    var url = post.link;
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
    
    //await sleep(500)
    
    var response = await axios(url, options)
    
    var parser = new NewsParser(response.data, pageMap.get(post.name).rules)

    //Do some text processing things
    //post-article Similarity
    post.article = parser.getArticle()
    
    ///////////////////////////
    //If Rule is not working//
    //////////////////////////
    if(!post.article){
        return false
    }
    
    var postKeywords = post.postKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post.message), 1000).map( obj => obj.word), stopwords);
    var articleKeywords = post.articleKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post.article), 1000).map( obj => obj.word), stopwords);
    var similarity = wordIntersectRatio( postKeywords, articleKeywords );
    post.intersection = similarity.intersectedWords
    post.ratio = similarity.ratio
    
    
    return {
        name: post.name,
        sizeAtPosting: post.sizeAtPosting,
        created: post.created,
        type: post.type,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        love: post.love,
        wow: post.wow,
        haha: post.haha,
        sad: post.sad,
        angry: post.angry,
        thankful: post.thankful,
        videoShareStatus: post.videoShareStatus,
        postViews: post.postViews,
        totalViews: post.totalViews,
        totalViewsForAllCrossposts: post.totalViewsForAllCrossposts,
        url: post.url,
        message: post.message,
        article: post.article,
        link: post.link,
        finalLink: post.finalLink,
        linkText: post.linkText,
        score: post.score,
        crawlState: "Success", // Waiting | Success | Failed
        postKeywords: postKeywords,
        articleKeywords: articleKeywords,
        intersection: similarity.intersectedWords,
        ratio: similarity.ratio
    }
        
}

function findAndCrawl(id, errorList){
    let crawledData = null
    return new Promise(function(resolve, reject){

        Post.find({_id: id}, async function(err, data){
            if(err) console.error(err);
            
           
            crawledData = await crawl(data[0])
            
            if(crawledData){
                
                resolve(crawledData)
                
            }else{
                //write in failed list and write in failed dir later
                console.error(chalk.red('\n' + crawledData))
                errorList.push(id)
                Post.update({ _id: id }, { $set: {crawlState : "Failed"} }, (err) => {
                    if(err) return handleError(err)
                })
                resolve(crawledData)
            }
        })
    })
}

function handleError(err){
    console.log(chalk.red(err.name))
}
