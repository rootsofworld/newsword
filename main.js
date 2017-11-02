const fs = require('fs')
const target = require('./target_list.json')
const evalSPA = require('./evalSPA.js')
const program = require('commander');
const appInfo = require('./app_config.json');
const json2csv = require('json2csv')


const option = {
        since : process.argv[2],
        until : process.argv[3],
        limit : process.argv[4]
    }

console.log(evalSPA)

async function main(){

    let result = []
    let tmp
    for(let i = 0; i < target.targetList.length; i++){
        tmp = await evalSPA({
                    page_id: target.targetList[i],
                    since : option.since,
                    until : option.until,
                    limit : option.limit
                }, appInfo)
        //console.log(tmp)
        result.push(tmp)
    }

      //////////// Each 粉專 //////////////
      //console.log(result.length)
      let json2csvFormat = []
      result.forEach((page) => {
        if(page.data.length === 0) {
            json2csvFormat.push({'紛絲專頁名稱':page.page_name,'貼文時間':"",'貼文內容':"",'新聞原文內容':"",'貼文關鍵詞':"",'新聞原文關鍵詞':""})
        }else{
            page.data.forEach(( post ) => {
                json2csvFormat.push({
                    '紛絲專頁名稱':page.page_name,
                    '貼文時間':post.created_time,
                    '貼文內容':post.message.replace(/\n/g,""),
                    '新聞原文內容':post.sourceArticle.raw.replace(/\n/g,""),
                    '貼文關鍵詞':wordsCSV(post.messageWords),
                    '新聞原文關鍵詞':wordsCSV(post.sourceArticle.words)})
            })
        }
      })
      //console.log(csv)
      let fields = ['紛絲專頁名稱','貼文時間','貼文內容','新聞原文內容','貼文關鍵詞','新聞原文關鍵詞']

      let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
      
      fs.writeFile('result.csv', csv, (err) => {
          if(err) throw err
      })


}

function wordsCSV(words){
    let tmp = []
    words.forEach((word) => {
        tmp.push(word.word)
    })
    console.log("words: " + tmp)
    
    return tmp.join(',')
}

function makeCSV( page ){
    let csv = ""
    if(!page.data) csv += `${page.page_name},"","","","",""\n`
    //console.log("page: " + page)
    page.data.forEach((post) => {
        csv += `${page.page_name},${post.created_time},${post.message.replace(/\n/g,"")},${post.sourceArticle.raw.replace(/\n/g,"")},${wordsCSV(post.messageWords)},${wordsCSV(post.sourceArticle.words)}\n`
    })
    return csv
}


main() 