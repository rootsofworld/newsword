const urlencode = require('urlencode');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk')
const axios = require('axios-https-proxy-fix')
const rp = require('request-promise');
const util = require('util')
const json2csv = require('json2csv')
/////////////////// 網頁解析與文字處理相關 /////////////////////
const wordProcesser = require('./wordprocesser.js')
const getAnonymous = require('./getAnonymous.js')
const hasDoubtfulImageText = require('./hasDoubtfulImageText.js')
const wordIntersectRatio = require('./wordIntersectRatio.js')
const NewsParser = require('./newsparser.js')
/////////////////////////////////////////////////////////////////
const batchTask = require('./batchTask.js');
const target = require('../config/pageList.json')
var pageMap = new Map()
target.targets.forEach(page => {
    pageMap.set(page.name, page)
})
//console.log(pageMap.entries())

const inputDB = '../data/dumbdb-init';
const outputDB = '../data/dumbdb-process'

var fsFuncList = ['readFile', 'writeFile', 'readdir', 'mkdir'];
const {readFile, writeFile, readDir, mkDir} = ((funcs) => {
    var funcSet = {}
    funcs.forEach(func => {
        funcSet[func] = util.promisify(fs[func])
    });
    return funcSet;
})(fsFuncList);

const pagelist = fs.readdirSync(inputDB).filter(filename => filename.slice(-4) === 'json')
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


async function crawl(index){
    var target = pagelist[index];
    const postlist = JSON.parse(await readFile(inputDB+'/'+target,'utf8'));
    console.log('Crawling... ' + postlist.pagename)
    /*
    if(postlist.complete){
        console.log(chalk.greenBright("This postlist is ready to go"))
        process.exit(0)
    }else if(postlist.progress){
        console.log(chalk.greenBright(postlist.progress))
    }
    */
    if(!pageMap.has(postlist.pagename)) console.error("Can't find " + postlist.pagename)
    const rule = pageMap.get(postlist.pagename).rules
    //console.log(rule)
    var LinkTypePosts = postlist.posts.filter(post => post['Type'] === 'Link')
    var total = LinkTypePosts.length
    var complete = 0
    var error_posts_count = 0

    for (let i = 0; i < LinkTypePosts.length; i++) {
        //option.headers['User-Agent'] = user_agent[Number((Math.random() * user_agent.length).toFixed(0))]
        var post = LinkTypePosts[i]
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
            var parser = new NewsParser(response.data, rule)

            //Do some text processing things
            //post-article Similarity
            post.article = parser.getArticle()
            //if(post.article === "") console.log('Oops')
            //console.log(post['Link Text'])
            var postKeywords = post.postKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post['Message']), 1000).map( obj => obj.word));
            var articleKeywords = post.articleKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post['article']), 1000).map( obj => obj.word));
            post.similarity = wordIntersectRatio( postKeywords, articleKeywords );
            printProgress(chalk.greenBright(`Progress : ${((++complete/total)*100).toFixed(2)}% ---- ${complete}/${total}`))
            
        }catch(err){
            error_posts_count++
            console.error(chalk.red('\n'+err+' : '+'Error request count: ' + error_posts_count))
            //console.error(chalk.red(err))
        }
    }
    /*// Faster Crawler
    LinkTypePosts = LinkTypePosts.map( async post => {
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
            await sleep(2000)
            var response = await axios(url, option)
            var parser = new NewsParser(response.data, rule)

            //Do some text processing things
            //post-article Similarity
            post.article = parser.getArticle()
            //if(post.article === "") console.log('Oops')
            //console.log(post['Link Text'])
            var postKeywords = post.postKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post['Message']), 1000).map( obj => obj.word));
            var articleKeywords = post.articleKeywords = wp.stopwordFilter(wp.extract(wp.punctuactionFilter(post['article']), 1000).map( obj => obj.word));
            post.similarity = wordIntersectRatio( postKeywords, articleKeywords );
            printProgress(chalk.greenBright(`Progress : ${((++complete/total)*100).toFixed(2)}% ---- ${complete}/${total}`))
            
        }catch(err){
            error_posts_count++
            console.error(chalk.red('\n'+err+' : '+'Error request count: ' + error_posts_count))
            //console.error(chalk.red(err))
        }
        return post
    })
    */////////////////

    //////// Utils /////////
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function printProgress(progress){
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(progress);
    }
    ///////////////////////

    Promise.all(LinkTypePosts).then(data => {
        console.log(`\n${postlist.pagename} is Done`)
        var result = {
            pagename:postlist.pagename,
            posts:data,
            progress:`${complete}/${total}`,
            complete: (complete === total)
        }
        
        fs.writeFile(outputDB+'/'+target, JSON.stringify(result), 'utf8', function(err){
            if(err) throw err;
            console.log('File updated:'+outputDB+'\n')
            console.log(chalk.greenBright(`Success: ${complete}`))
            console.log(chalk.redBright(`Failed: ${error_posts_count}`))
        })
    }).catch(err => {
        throw err
    })
}

crawl(process.argv[2])
