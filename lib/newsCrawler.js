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
const target = require('../config/pageList.json')
var pageMap = new Map()
target.targets.forEach(page => {
    pageMap.set(page.name, page)
})
//console.log(pageMap.entries())

const dbPath = '../data/dumbdb';

var fsFuncList = ['readFile', 'writeFile', 'readdir', 'mkdir'];
const {readFile, writeFile, readDir, mkDir} = ((funcs) => {
    var funcSet = {}
    funcs.forEach(func => {
        funcSet[func] = util.promisify(fs[func])
    });
    return funcSet;
})(fsFuncList);

const pagelist = fs.readdirSync(dbPath).filter(filename => filename.slice('-4') === 'json')
//console.log(pagelist)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function printProgress(progress){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(progress);
}

var option = {
    method: 'get',
    headers: {
        'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'
    },
    timeout: 60000,
    validateStatus: function (status) {
        return status >= 200 && status < 300 || status === 404; // default
    }
}


async function test(index){
    var target = pagelist[index];
    const postlist = JSON.parse(await readFile(dbPath+'/'+target,'utf8'));
    console.log('Crawling... ' + postlist.pagename)
    if(!pageMap.has(postlist.pagename)) console.error("Can't find " + postlist.pagename)
    const rule = pageMap.get(postlist.pagename).rules
    //console.log(rule)
    
    var newPostlist = postlist.posts.filter(post => post['Type'] === 'Link')
    var total = newPostlist.length
    var complete = 0
    var error_posts_count = 0
    newPostlist = newPostlist.map(async post => {
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
            console.log(await sleep(5000).then(s => true))
            var response = await axios(url, option)
            var parser = new NewsParser(response.data, rule)
            post.article = parser.getArticle()
            printProgress(chalk.greenBright(`Progress : ${((complete++/total)*100).toFixed(2)}% ---- ${complete}/${total}`))
        }catch(err){
            error_posts_count++
            console.error(chalk.red('\n'+err+' : '+'Error request count: ' + error_posts_count))
        }
        return post
    })

    Promise.all(newPostlist).then(data => {
        console.log(`\n${postlist.pagename} is Done`)
        var result = {
            pagename:postlist.pagename,
            posts:data
        }
        
        fs.writeFile(dbPath+'/'+target, JSON.stringify(result), 'utf8', function(err){
            if(err) throw err;
            console.log('File updated\n')
            console.log(chalk.greenBright(`Success: ${complete}`))
            console.log(chalk.redBright(`Failed: ${error_posts_count}`))
        })
        //console.log(Object.keys(result))
    }).catch(err => {
        throw err
    })
}

test(process.argv[2])
/*
pagelist.forEach(async page => {
    const postlist = JSON.parse(await readFile(dbPath+'/'+page,'utf8'));
    console.log(postlist.pagename)
    if(!pageMap.has(postlist.pagename)) console.error("Can't find " + postlist.pagename)
    const rule = pageMap.get(postlist.pagename).rules
    //console.log(rule)
    
    var newPostlist = postlist.posts
            .filter(post => post['Type'] === 'Link')
            /*.map(async post => {
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
            sleep(500)
            var response = await axios(url, option)
            var parser = new NewsParser(response.data, rule)
            post.article = parser.getArticle()
            return post
        })

    Promise.all(newPostlist).then(data => {
        console.log(`${postlist.pagename} is Done!!`)
        var result = {
            pagename:postlist.pagename,
            posts:data
        }
        
        fs.writeFile(dbPath+'/'+page, JSON.stringify(result), 'utf8', function(err){
            if(err) throw err;
        })
        //console.log(Object.keys(result))
    })
  
 //console.log(newPostlist[0])  
})*/

