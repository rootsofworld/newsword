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
const request = require('request')
const chalk = require('chalk')
const appInfo = require('./app_config.json');
const sample = require('./sample.json')


function evalSPA(option, appInfo) {

    function generateUrlWithoutAccesstoken( option, appInfo ){

        let since = moment(option.since, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
        let until = moment(option.until, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000

        return `
        https://graph.facebook.com/v2.10/${option.target}?access_token=${appInfo.appId}|${appInfo.appSecret}&fields=id,posts.limit(${option.limit}).since(${since}).until(${until}){message,link,message_tags,permalink_url,picture,story,target,type,source,timeline_visibility,status_type,description,caption,created_time}
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

    rp( graphUrl )
        .then( ( res ) => {
            res = JSON.parse(res);
            let linkPosts = res.posts.data.filter((post) => {
                    return post.type === "link";
                })
    ///////////////////Check if don't have link-type post////////////////
            if(linkPosts.length === 0){ 
                return false
            }else{
                //console.log(linkPosts)
                return rp(linkPosts[0].link)
            }
        })
        .then(( source ) => {
            if(!source){
                console.log("Don't have link-type post!!")
            }else{
                //console.log(source);
                let articleContent = extractArticle(source)
                /*fs.writeFile('test.html', source, 'utf8', (err) => {
                    if(err) throw err;
                })*/
                fs.writeFile('test.txt', articleContent, 'utf8', (err) => {
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
    function extractArticle( body ){
        
        let pElementCatcher = /<p>.*(?=<\/p>)/g;
        $ = cheerio.load(body)
        let pList = $('p')
        articleContent = pElementCatcher.exec(body)
        //let mainSection = $(`.${className}`)
        console.log(pList.length)
        for(let i = 0; i < pList.length; i++){
            if(i % 2 === 0)
                console.log(chalk.yellowBright(pList[i].children[0].data))
                console.log(chalk.redBright(pList[i].children[0].data))
        }
        return articleContent
    }
}