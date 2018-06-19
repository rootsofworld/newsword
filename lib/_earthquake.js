const csv = require('csvtojson');
const fs = require('fs');
const axios = require('axios')
const appInfo = require('../config/app_config.json');
const sleep = require('./sleep.js')


const outputdir = '../data/p8/'

async function cut(filename){
    var data = await csv().fromFile('../data/' + filename)
    console.log(data.length)
    function Page(pagename){
        this.pagename = pagename || ""
        this.posts = []
    }

    var current = data[0]["紛絲專頁名稱"];
    console.log(current)
    var b = new Page(current)
    for(let i = 0; i < data.length; i++){
        console.log(data[i]["紛絲專頁名稱"])
        if(current !== data[i]["紛絲專頁名稱"]){
            fs.writeFileSync(outputdir + current + '.json', JSON.stringify(b), 'utf8',(err) => {
                if(err) throw err;
                console.log(`Write ${current} in the ${outputdir}`)
            })
            current = data[i]["紛絲專頁名稱"]
            b = new Page(current)
        }
        var pageid = data[i]["貼文連結"].split('/')[3]
        var postid = data[i]["貼文連結"].split('/')[5]
        console.log(pageid, postid)
        if(pageid && postid){
            var tm = await getPost(pageid, postid)
            await sleep(5000)
        }
        b.posts.push({
            Name: current,
            Created: tm.created_time || "",
            Type: "Link",
            Message: tm.message || "",
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

        if(i === data.length - 1){
            fs.writeFileSync(outputdir + current + '.json', JSON.stringify(b), 'utf8',(err) => {
                if(err) throw err;
                console.log(`Write ${current} in the ${outputdir}`)
                console.log('All pushed')
            })
        }
    }

    return true;

}

cut(process.argv[2])
    .then(() => {
        console.log('Done')
    })

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
