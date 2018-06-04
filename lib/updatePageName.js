const target = require('../config/pageList.json');
const appInfo = require('../config/app_config.json');
const axios = require('axios');
const fs = require('fs')
console.log(appInfo.appId, appInfo.appSecret)
var newPagelist = target.targets.map( async page => {
    //sleep(1000)
    var info = await axios(`https://graph.facebook.com/v3.0/${page.id}?access_token=${appInfo.appId}|${appInfo.appSecret}&fields=id,name`)
    if(info.data.name !== page.name){
        page.name = info.data.name
        console.log(`Pagename has changed: ${page.name} => ${info.data.name}`)
        return page
    }
    return page
});
Promise.all(newPagelist).then(data => {
    //console.log(data)
    var result = {targets:data}
    fs.writeFile('../config/pageList.json',JSON.stringify(result),'utf8',function(err){
        if(err) throw err
        console.log('Pagelist Updated')
    })
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
