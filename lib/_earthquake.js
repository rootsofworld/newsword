const csv = require('csvtojson');
const fs = require('fs');
const axios = require('axios')
const appInfo = require('../config/app_config.json');
const sleep = require('./sleep.js')


const outputdir = '../data/earthquake/'

async function cut(/*filename*/){
    const postlib = await require('./postlib.js')()
    //console.log(postlib.slice(0,10))
    //var data = await csv().fromFile('../data/' + filename)

    function Page(pagename){
        this.pagename = pagename || ""
        this.posts = []
    }

    var current = postlib[0]["Name"];
    console.log(current)
    var b = new Page(current)
    for(let i = 0; i < postlib.length; i++){
        console.log(postlib[i]["Name"])
        if(current !== postlib[i]["Name"]){
            fs.writeFileSync(outputdir + current + '.json', JSON.stringify(b), 'utf8',(err) => {
                if(err) throw err;
                console.log(`Write ${current} in the ${outputdir}`)
            })
            current = postlib[i]["Name"]
            b = new Page(current)
        }
        
       b.posts.push(postlib[i])

       /* for 人工篩選資料
        var cm = mapItem(data[i]["貼文連結"])
        b.posts.push({
            Name: current,
            Created: cm.created,
            Type: "Link",
            Message: cm.message || "",
            URL: data[i]["貼文連結"],
            Title: data[i]["新聞標題"],
            Link: data[i]["原文連結"],
            Like: data[i]["LIKE"],
            Love: data[i]["LOVE"],
            Angry: data[i]["ANGRY"],
            Sad: data[i]["SAD"],
            Haha: data[i]["HAHA"],
            Wow: data[i]["WOW"],
        })
        */

        if(i === postlib.length - 1){
            fs.writeFileSync(outputdir + current + '.json', JSON.stringify(b), 'utf8',(err) => {
                if(err) throw err;
                console.log(`Write ${current} in the ${outputdir}`)
                console.log('All pushed')
            })
        }
    }

    return true;

    function mapItem(key){
        if(!key){
            return {
                created: "Don't have post",
                message: undefined
            }
        }
        console.log(key)
        var mapping = postlib.find( post => post["URL"] === key)
        return {
            created: mapping["Created"],
            message: mapping["Message"]
        }
    }
}

cut()
    .then(() => {
        console.log('Done')
    })



/*
async function getPost(pagename, postid){

    var option = {
        headers: {
            'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'
        },
        timeout: 10000
    }
    var pageid = await axios(`https://graph.facebook.com/v3.0/${pagename}?access_token=${appInfo.appId}|${appInfo.appSecret}`, option)
    var url = `https://graph.facebook.com/v3.0/${pageid.data.id}_${postid}?access_token=${appInfo.appId}|${appInfo.appSecret}`
    var data = await axios(url, option)
    
    return data.data
}
*/
