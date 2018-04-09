const rp = require('request-promise');
const urlencode = require('urlencode')
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk')
const appInfo = require('../config/app_config.json');
const target = require('../config/pageList.json')
const getPage = require('./axiosGet.js')

const timeRange = {
        since : "2018-02-07", //yyyy-mm-dd   //process.argv[2]
        until : "2018-02-12", //yyyy-mm-dd   //process.argv[3]
    }
/*
const fanpage = {
    id: '110699089014688',
    name: '三立新聞 Set News',
    rules: {
        article: "#Content1 > p",
        images: ""
    }
}
const graphUrl = generateGraphUrl( timeRange, fanpage.id, appInfo )
getPostList(graphUrl, fanpage.id, fanpage.name, fanpage.rules)
*/



target.targets.forEach( fanpage => {
    const graphUrl = generateGraphUrl( timeRange, fanpage.id, appInfo )
    getPostList(graphUrl, fanpage.id, fanpage.name, fanpage.rules)
        .catch( err => { throw err })
})

/**
 * @param {String} url FB Graph API Call to get FanPage Posts Data
 * @param {String} id Page ID
 * @param {String} name Page Name
 * @summary use paging method to get all posts
 * @return {Object} postList
 *      @property {String} id
 *      @property {String} name
 *      @property {Array} data
 *      @property {Object} typeCount
 * 
 */
async function getPostList(url, id, name, rules){
    /////// Data Init ////////
    let postList = {
        id: id,
        name: name,
        rules: rules,
        posts:[],
        typeCount:{
            link: 0,
            video: 0,
            photo: 0,
            status: 0,
            event: 0
        }
    }

    console.log(chalk.magenta("///////////////////////////////////////////////////"))
    console.log(chalk.magenta(`Getting ${name}'s postList`))
    console.log(chalk.magenta("Paging ..."))

    ////////// Process First Page ///////////
    let firstPage = await getPage(url)
    if(firstPage.data.posts === undefined) console.log('This Page has some trouble: ', name, id)
    firstPage.data.posts.data.forEach( el => {
        postList.posts.push( el )
    })
    //////// If Not Just Have One Page ////////
    if(firstPage.data.posts.paging.next !== undefined){
        
        ////////// Process Other Pages //////////
        let currentPage = await getPage(firstPage.data.posts.paging.next)
        currentPage.data.data.forEach( el => {
            postList.posts.push(el)
        })
        while(currentPage.data.paging.next !== undefined){
            currentPage = await getPage(currentPage.data.paging.next)
            currentPage.data.data.forEach( el => {
                postList.posts.push(el)
            })
        }
    }


    /////////////// Post Type Counting //////////////
    postList.posts.forEach((post) => {

        post.sourceArticle = {
            raw : "",
            words : []
        }
        post.messageWords = []

        if(post.type === 'video'){

            postList.typeCount.video++

        }else if(post.type === 'photo'){

            postList.typeCount.photo++
        
        }else if(post.type === 'status'){

            postList.typeCount.status++

        }else if(post.type === 'event'){

            postList.typeCount.event++

        }else if(post.type === 'link'){

            postList.typeCount.link++

        }else{

            console.log(chalk.red("[Warning] There is some unknown post type: " + post.type))
        }
    })

    ////////// Write The Result In /data/postlist /////////////
    fs.writeFile(`../data/test/posts-${timeRange.since}-${timeRange.until}-${id}.json`,JSON.stringify(postList),'utf8',(err, data) => {
        if( err ) throw err
        console.log(chalk.blue(`${name}'s postList since ${timeRange.since} to ${timeRange.until} is done`))
        console.log(chalk.cyan("Posts total : " + postList.posts.length))
        console.log(chalk.cyan("TypeCounter: "))
        console.log(chalk.cyan(`\tLink : ${postList.typeCount.link}`))
        console.log(chalk.cyan(`\tVideo : ${postList.typeCount.video}`))
        console.log(chalk.cyan(`\tPhoto : ${postList.typeCount.photo}`))
        console.log(chalk.cyan(`\tStatus : ${postList.typeCount.status}`))
        console.log(chalk.cyan(`\tEvent : ${postList.typeCount.event}`))
        if(postList.typeCount.link === 0)
            console.log(chalk.red("[Warning] Don't have link-type post!!"))
        console.log(chalk.magenta("///////////////////////////////////////////////////"))
    })

}/////////////////////// End of One FanPage /////////////////////////// 

function generateGraphUrl( timeRange, id, appInfo ){
    //Transform to milliseconds
    let since = moment(timeRange.since, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
    let until = moment(timeRange.until, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
    return `https://graph.facebook.com/v2.12/${id}?access_token=${appInfo.appId}|${appInfo.appSecret}&fields=id,name,posts.since(${since}).until(${until}){type,created_time,updated_time,name,message,message_tags,link,permalink_url,picture,description,caption,reactions.type(LIKE).limit(0).summary(true).as(like),reactions.type(LOVE).limit(0).summary(true).as(love),reactions.type(WOW).limit(0).summary(true).as(wow),reactions.type(HAHA).limit(0).summary(true).as(haha),reactions.type(SAD).limit(0).summary(true).as(sad),reactions.type(ANGRY).limit(0).summary(true).as(angry)}`
}



function logProperty( obj ){
    let properties = Object.keys(obj)
    properties.forEach( property => {
        console.log(property)
    })
}








