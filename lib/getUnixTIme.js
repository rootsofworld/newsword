const appInfo = require('../config/app_config.json');
const moment = require('moment');

var timeRange = {since:process.argv[2], until:process.argv[3]}
var pageid = process.argv[4]

function generateGraphUrl( timeRange, id, appInfo ){
    //Transform to milliseconds
    let since = moment(timeRange.since, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
    let until = moment(timeRange.until, ['YYYY-MM-DD','YYYY-MM-DD HH:mm']).valueOf() / 1000
    console.log('Since: ', since)
    console.log('Until: ', until)
    return `https://graph.facebook.com/v2.12/${id}?access_token=${appInfo.appId}|${appInfo.appSecret}&fields=id,name,posts.since(${since}).until(${until}){type,created_time,updated_time,name,message,message_tags,link,permalink_url,picture,description,caption,reactions.type(LIKE).limit(0).summary(true).as(like),reactions.type(LOVE).limit(0).summary(true).as(love),reactions.type(WOW).limit(0).summary(true).as(wow),reactions.type(HAHA).limit(0).summary(true).as(haha),reactions.type(SAD).limit(0).summary(true).as(sad),reactions.type(ANGRY).limit(0).summary(true).as(angry)}`
}

generateGraphUrl(timeRange, pageid, appInfo)