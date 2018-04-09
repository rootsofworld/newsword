/**
 *  evalSPA.js (SPA = 'S'imilarity of 'P'ost and 'A'rticle)
 *  Similarity is just simply evaluated by word counts for now
 *  ////////////////////// 2017 ///////////////////////
 *  @param {Object} option {
 *      @param {String} target : page id
 *      @param {String} since : start point of request's duration
 *      @param {String} until : end point of request's duration
 *      @param {Number} limit : request limit
 *  }
 * 
 *  @param {Object} appInfo {   //from app_config.json File
 *      @param {String} appName
 *      @param {String} appId
 *      @param {String} appSecret
 *      @param {String} purpose
 *  }
 * 
 *  @return {Object} {
 *      permalink
 *      page_name
 *      page_id
 *      since
 *      until
 *      data : [
 *          {
 *              ...Existed Info
 * 
 *              sourceArticle : {      // From Crawler
 *                  raw : Raw content of article
 *                  words : Count of words Array
 *              }
 *              messageWords : []
 *          }
 *      ]
 * 
 *       typeCount : {
 *         video,photo,link             
 *       }
 *      
 * } 
 */
const rp = require('request-promise');
const urlencode = require('urlencode')
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk')
//const natural = require('natural')
//const jc = require('jaccard')
/////////////////////////////////////////////////////////////////
const wordProcesser = require('./wordProcesser.js')
const getAnonymous = require('./getAnonymous.js')
const hasDoubtfulImageText = require('./hasDoubtfulImageText.js')
const wordIntersectRatio = require('./wordIntersectRatio.js')
const NewsParser = require('./newsparser.js')
/////////////////////////////////////////////////////////////////
//const appInfo = require('./app_config.json');
//const sample = require('./target_list.1.json')
//require('longjohn')

let WP = new wordProcesser()

///////////// Call once per Page ///////////////
function evalSPA(option, appInfo) {
    return new Promise((resolve, reject) => {
        let postCounter = {
            current : 0,
            total : 0
        }
        let result = {}
        let bodyPool = [] //Crawled body put in this first

        result.typeCount = {
            video : 0,
            photo : 0,
            link : 0,
            status: 0
        }


        function generateGraphUrl( option, appInfo ){
            //Transform to milliseconds
            let since = moment(option.since, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
            let until = moment(option.until, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
            return `
            https://graph.facebook.com/v2.11/${option.target.page_id}?access_token=${appInfo.appId}|${appInfo.appSecret}&fields=id,name,posts.since(${since}).until(${until}){type,created_time,message,link,message_tags,permalink_url,picture,description,caption}
            `
        }
    
        const graphUrl = generateGraphUrl( option, appInfo )

        result.data = []
        rp( graphUrl )
            .then( ( res ) => {


                res = JSON.parse(res);
                result.page_name = res.name
                result.page_id = res.id
                result.since = option.since
                result.until = option.until

                if( res.posts === undefined ){
                    return result
                }
                
                res.posts.data.forEach((post) => {

                    post.sourceArticle = {
                        raw : "",
                        words : []
                    }
                    post.messageWords = []

                    if(post.type === 'video'){

                        result.typeCount.video++

                    }else if(post.type === 'photo'){

                        result.typeCount.photo++
                    
                    }else if(post.type === 'status'){

                        result.typeCount.status++

                    }else if(post.type === 'link'){

                        result.typeCount.link++
                        result.data.push(post)

                    }else{

                        console.log(chalk.red("[Warning] There is some unknown post type: " + post.type))
                    }
                })
                
                console.log("Page Name : " + result.page_name)
                console.log(chalk.blue("TypeCounter: "))
                console.log(chalk.blueBright(`\tVideo : ${result.typeCount.video}`))
                console.log(chalk.blueBright(`\tPhoto : ${result.typeCount.photo}`))
                console.log(chalk.blueBright(`\tLink : ${result.typeCount.link}`))
                console.log(result.data.length)
                postCounter.total = result.data.length  

                return result

            })
            .then(( result ) => {
                /////////////// Check post type and dispatch post's source webpage request ////////////
                if(!result){

                    console.log(chalk.red("[Warning] There is no post from your option"))
                    fs.writeFile(`result-${option.target.page_id}.json`, JSON.stringify(result), 'utf8', (err) => {
                        if(err) throw err
                        resolve(result)
                    })
                    

                }else if(result.typeCount.link === 0){

                    console.log(chalk.red("[Warning]" + option.target.page_name + "Don't have link-type post!!"))
                    fs.writeFile(`result-${option.target.page_id}.json`, JSON.stringify(result), 'utf8', (err) => {
                        if(err) throw err
                        resolve(result)
                    })

                }else{
                    
                    result.data.forEach((post) => {
                        //console.log(post.link)
                        // Async Function
                        extractArticle(post, postCounter, bodyPool, option.target.rules)

                        post.messageWords = WP.jieba.extract(WP.punctuactionFilter(post.message),100).map((obj) => obj.word)

                    })

                }
            }).catch((err) => {
                throw err
            })

            function crawlingDoneHandler(pool) {
                //造成資料誤植的嫌疑犯
                pool = pool.sort((post1,post2) => {
                    return post2.created_time - post1.created_time
                })
                console.log(pool.length)

                //造成資料誤植的嫌疑犯
                result.data.forEach((post,i) => {
                    post.fb_link = pool[i].fb_link
                    post.sourceArticle.raw = pool[i].article
                    post.sourceArticle.keywords = WP.jieba.extract(WP.punctuactionFilter(post.sourceArticle.raw), 10).map((obj) => obj.word)
                    post.sourceArticle.words = WP.jieba.extract(WP.punctuactionFilter(post.sourceArticle.raw), 100).map((obj) => obj.word)
                    post.similarity = wordIntersectRatio(post.messageWords, post.sourceArticle.words)
                    post.anonymousSentences = getAnonymous(post.sourceArticle.raw)
                    post.hasDoubtfulImageText = hasDoubtfulImageText(pool[i].imagesText)
                    //console.log(post.similarity.intersectedWords)
                })

                fs.writeFile(`../data/result-${option.page_id}.json`, JSON.stringify(result), 'utf8', (err) => {
                        if(err) throw err;
                        resolve(result)
                })
            }
        
        
            function extractArticle( post, postCounter, pool, rules ){
                var fuckPNN = /pnn.pts.org.tw|www.cmmedia.com.tw/g
                var url = post.link
                if(fuckPNN.test(post.link)){
                    var head = /https:\/\/|http:\/\//g
                    var str = post.link
                    var headMatched = head.exec(str)
                    str = str.slice(head.lastIndex)
                    url = headMatched[0] + str.split('/').map((substr) => urlencode(urlencode.decode(substr))).join('/')
                }
                let option = {
                    method: 'GET',
                    url: url,
                    headers: {
                        'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'
                    }
                }
                rp(option)
                    .then((body) => {
                        let created_time = new Date(post.created_time)

                        const noscriptFilter = /<noscript.+<\/noscript>/g
                        body.replace(/<noscript.+<\/noscript>/g, "")
                        let parser = new NewsParser(body, rules)

                        pool.push({
                            id: post.id,
                            created_time: created_time.valueOf(),
                            fb_link: post.permalink_url,
                            doneAt: Date.now(), //for debug
                            body: body,
                            article: parser.getArticle(),
                            imagesText: parser.getImagesText()
                        })
                        postCounter.current++
                        if(postCounter.current === postCounter.total ) crawlingDoneHandler(pool)
                    }).catch((err) => {
                        console.log(err)
                        console.log(chalk.greenBright(`Error occured with this URL : ${url}`))
                        console.log(chalk.greenBright(`Error occured with this FB URL : ${post.permalink_url}`))
                        
                    })
            }
    })
}

/*
evalSPA({
    page_id: "286603368359862",
    since: "2017-10-22",
    until: "2017-10-25",
    limit: 100
},appInfo)
*/

module.exports = evalSPA