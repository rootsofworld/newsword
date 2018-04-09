const fs = require('fs')
const target = require('./target_list.1.json')
const evalSPA = require('./evalSPA.js')
const program = require('commander');
const appInfo = require('./app_config.json');
const json2csv = require('json2csv')


//console.log(evalSPA)

async function getData(since, until, limit){

    let result = []
    let tmp
    for(let i = 0; i < target.targetList.length; i++){
        tmp = await evalSPA({
                    page_id: target.targetList[i],
                    since : since,
                    until : until,
                    limit : limit
                }, appInfo)
        //console.log(tmp)
        result.push(tmp)
    }

      //////////// Each 粉專 //////////////
      //console.log(result.length)
      let json2csvFormat = []
      result.forEach((page) => {
        if(page.data.length === 0) {
            json2csvFormat.push({'紛絲專頁名稱':page.page_name,'貼文時間':"",'貼文內容':"",'新聞原文內容':"",'貼文關鍵詞':"",'新聞原文關鍵詞':"",'原文連結':""})
        }else{
            page.data.forEach(( post ) => {
                json2csvFormat.push({
                    '紛絲專頁名稱': page.page_name,
                    '貼文時間': post.created_time,
                    '貼文內容': post.message.replace(/\n|\t|\<.*\>/g,""),
                    '新聞原文內容': post.sourceArticle.raw.replace(/\n|\t|\<.*\>/g,""),
                    '貼文關鍵詞': wordsCSV(post.messageWords),
                    '新聞原文關鍵詞': wordsCSV(post.sourceArticle.words),
                    '原文連結': post.link
                })
            })
        }
      })
      //console.log(csv)
      let fields = ['紛絲專頁名稱','貼文時間','貼文內容','新聞原文內容','貼文關鍵詞','新聞原文關鍵詞','原文連結']

      let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
      
      fs.writeFile(`result-${since}-${until}.csv`, csv, (err) => {
          if(err) throw err
      })


}




module.exports = getData 