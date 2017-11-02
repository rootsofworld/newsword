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
const cheerio = require('cheerio');
const fs = require('fs');
//const fbgraph = require('fbgraph');
const moment = require('moment');
//const request = require('request')
const chalk = require('chalk')
const nodejieba = require('nodejieba')
const appInfo = require('./app_config.json');
//const sample = require('./sample.json')


nodejieba.load({
    dict: nodejieba.DEFAULT_DICT,
    hmmDict: nodejieba.DEFAULT_HMM_DICT,
    userDict: 'node_modules/nodejieba/dict/dict.txt.big',
    idfDict: nodejieba.DEFAULT_IDF_DICT,
    stopWordDict: 'node_modules/nodejieba/dict/stop_words.utf8',
  });


function evalSPA(option, appInfo) {

    let postCounter = {
        current : 0,
        total : 0
    }
    let noPost = false
    let result = {}
    let bodyPool = [] //Crawled body put in this first

    result.typeCount = {
        video : 0,
        photo : 0,
        link : 0
    }


    function generateUrlWithoutAccesstoken( option, appInfo ){

        let since = moment(option.since, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
        let until = moment(option.until, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000

        return `
        https://graph.facebook.com/v2.10/${option.target}?access_token=${appInfo.appId}|${appInfo.appSecret}&fields=id,name,posts.limit(${option.limit}).since(${since}).until(${until}){type,created_time,message,link,message_tags,permalink_url,picture,description,caption}
        `
    }
   
    const graphUrl = generateUrlWithoutAccesstoken( option, appInfo )

    result.data = []
    rp( graphUrl )
        .then( ( res ) => {


            res = JSON.parse(res);
            if(typeof res.post === undefined){
                noPost = true
                return false
            }
            result.page_name = res.name
            result.page_id = res.id
            result.since = option.since
            result.until = option.until

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

                }else if(post.type === 'link'){

                    result.typeCount.link++
                    result.data.push(post)

                }else{

                    console.log(chalk.red("[Warning] There is some unknown post type: " + post.type))
                }
            })
            

            console.log(chalk.yellow("TypeCounter: "))
            console.log(chalk.yellowBright(`\tVideo : ${result.typeCount.video}`))
            console.log(chalk.yellowBright(`\tPhoto : ${result.typeCount.photo}`))
            console.log(chalk.yellowBright(`\tLink : ${result.typeCount.link}`))

            console.log(result)
            console.log(result.data.length)
            postCounter.total = result.data.length

            return result

        })
        .then(( result ) => {

            if(!result){

                console.log("There is no post from your option")
                return false

            }else if(result.data.length < 1){

                console.log("Don't have link-type post!!")

            }else{
                
                result.data.forEach((post) => {

                    extractArticle(post.link, post.id, post.created_time, postCounter, bodyPool)
                    post.messageWords = nodejieba.extract(punctuactionFilter(post.message),10)

                })

            }
        })

        function finishCrawlingHandler(pool) {
            pool = pool.sort((post1,post2) => {
                return post2.created_time - post1.created_time
            })
            console.log(pool.length)

            result.data.forEach((post,i) => {
                post.sourceArticle.raw = pool[i].textFromTagP
                post.sourceArticle.words = nodejieba.extract(punctuactionFilter(post.sourceArticle.raw),10)
            })

            fs.writeFile(`result-${option.target}.json`, JSON.stringify(result), 'utf8', (err) => {
                    if(err) throw err;
            })
        }
    
    
        function extractArticle( url, id, time, postCounter, pool ){
        
          rp(url)
            .then((body) => {
                let created_time = new Date(time)
                $ = cheerio.load(body)
                pList = $('p')
                //let mainSection = $(`.${className}`)
                //console.log(source.pList.length)
                let tmpArray = []
                for(let i = 0; i < pList.length; i++){
                   if(!pList[i].children[0]) {
                       tmpArray.push("")
                       continue
                   }
                   tmpArray.push(pList[i].children[0].data)
                }
                pool.push({
                    id: id,
                    created_time: created_time.valueOf(),
                    doneAt: Date.now(),
                    body: body,
                    textFromTagP: tmpArray.join('\n')
                })
                postCounter.current++
                if(postCounter.current === postCounter.total ) finishCrawlingHandler(pool)
            })
        }
}

function punctuactionFilter(str){
    if(!str) return
    str = str.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g,"")
    str = str.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\—|\－|\」|\「|\！|\（|\）|\。|\，|\：|\、|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\？|\n]/g,"")
    return str
}




evalSPA({
    target: "136626779700062",
    since: "2017-10-22",
    until: "2017-10-25",
    limit: 100
},appInfo)

module.exports = evalSPA