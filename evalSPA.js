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
 *              date : Post's creation time
 *              post : {
 *                  raw : Raw content of post
 *                  words : Count of words Array
 *              }
 *              article : {      // From Crawler
 *                  raw : Raw content of article
 *                  words : Count of words Array
 *              }
 *              @param {Number} similarity
 *          }
 *      ]
 *      post_count : data.length
 *      @param {Number} averageSimilarity
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


function evalSPA(option, appInfo) {

    let result = {}
    
    let postsTypeCount = {
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
    //console.log(graphUrl)

    /*request(graphUrl, (err, res) => {
        fs.writeFile(`posts-${new Date(graphCall.since).valueOf()}-${new Date(graphCall.until).valueOf()}.json`, JSON.stringify(JSON.parse(res.body)),'utf8',(err) => {
            if(err) throw err;
        })
        console.log(JSON.stringify(JSON.parse(res.body)));
    })*/

    function modifyPostData(post){
        
        post.sourceArticle = {
            raw : "",
            words : []
        }
        post.messageWords = []
        return post
    }

    result.data = []
    rp( graphUrl )
        .then( ( res ) => {

            res = JSON.parse(res);
            result.page_name = res.name
            result.page_id = res.id
            result.since = option.since
            result.until = option.until

            res.posts.data.forEach((post) => {
                if(post.type === 'video'){

                    postsTypeCount.video++

                }else if(post.type === 'photo'){

                    postsTypeCount.photo++

                }else if(post.type === 'link'){

                    postsTypeCount.link++
                    result.data.push(modifyPostData(post))

                }else{

                    console.log(chalk.red("[Warning] There is some unknown post type: " + post.type))
                }
            })
            
            console.log(chalk.yellow("TypeCounter: "))
            console.log(chalk.yellowBright(`\tVideo : ${postsTypeCount.video}`))
            console.log(chalk.yellowBright(`\tPhoto : ${postsTypeCount.photo}`))
            console.log(chalk.yellowBright(`\tLink : ${postsTypeCount.link}`))

            console.log(result)
            console.log(result.data.length)
            
            return result

        })
        .then(( result ) => {
            if(result.data.length < 1){
                console.log("Don't have link-type post!!")
            }else{
                //console.log(source);
                result.data.map((post) => {

                    post.sourceArticle.raw = extractArticle(post.link)
                    post.sourceArticle.words = nodejieba.extract(post.sourceArticle.raw,5)
                    post.messageWords = nodejieba.extract(post.message,5)

                })
                
                fs.writeFile('result.json', JSON.stringify(result), 'utf8', (err) => {
                    if(err) throw err;
                })
            }
        })



    /**
     * 
     * @param {String} body //html data from request
     * @param {String} className //main article section's className
     * @param {Function} callback  //When extraction is done
     */
    function extractArticle( url ){
        let pList
         rp(url)
            .then((body) => {

                $ = cheerio.load(body)
                pList = $('p')
                
                //let mainSection = $(`.${className}`)
                console.log(pList.length)
                for(let i = 0; i < pList.length; i++){
                    if(i % 2 === 0)
                        console.log(chalk.yellowBright(pList[i].children[0].data))
                        console.log(chalk.redBright(pList[i].children[0].data))
                }
                return pList
            })
        return pList
    }
}

function punctuactionFilter(str){
    
}

function stopwordFilter(str){
    
}



evalSPA({
    target: "466505160192708",
    since: "2017-10-01",
    until: "2017-10-07",
    limit: 100
},appInfo)

module.exports = evalSPA