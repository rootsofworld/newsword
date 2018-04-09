const urlencode = require('urlencode')
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk')
const async = require('async')
const axios = require('axios')
const util = require('util')
const json2csv = require('json2csv')
//const natural = require('natural')
//const jc = require('jaccard')
/////////////////// 網頁解析與文字處理相關 /////////////////////
const wordProcesser = require('./wordProcesser.js')
const getAnonymous = require('./getAnonymous.js')
const hasDoubtfulImageText = require('./hasDoubtfulImageText.js')
const wordIntersectRatio = require('./wordIntersectRatio.js')
const NewsParser = require('./newsparser.js')
/////////////////////////////////////////////////////////////////
const target = require('../config/pageList.json')
const axiosGet = require('./axiosGet.js')
/**
 * 策略：所有粉絲團物件非同步地處理相同最大數量的post
 * > 待所有粉絲團物件都處理完一批貼文才全部進行下一批處理
 * @param {Number} pack 決定單次處理的post數量：暫定 25 篇貼文
 * 讀取 /data/postlist/ 內的所有檔案(posts-since-until-pageID.json)
 * 直接全部讀進來？
 * > 2018/01/01~2018/01/05 的postlist檔案總共 8.2MB -> 假設當成10MB再乘100倍(約等於500天的資料量)也才 1GB 左右
 * > 直接全讀應該OK，一次頂多撈半年(甚至更短)，也才180天左右的資料量(約300多MB)
 * ------------------------------
 * 讀取完後為每個檔案建立一個物件 {Fanpage}
 * > @property {String} page_id
 * > @property {String} page_name
 * > @property {Object} rules 網頁解析規則 from (/config/pageList.json).targets[i].rules
 * > 用來存待處理的post的陣列 
 * > @property {Array} standby
 * > 根據 {pack} 批次進行處理
 * > 處理完的post，將id或created_time存入
 * > @property {Array} complete 用來DEBUG，或許不需要
 * > @property {Object} data 所有post處理完後的結果整合成這個物件
 * > @property {Boolean} done 這個粉專的資料是否處理完畢
 * ------------------------------
 * 確認所有粉絲團物件的 {standby} 為空之後，進行排序和轉成csv檔等處理
 */


let since = "2018-02-07" //yyyy-mm-dd   //process.argv[2]
let until = "2018-02-12" //yyyy-mm-dd   //process.argv[3]

const readFile = util.promisify(fs.readFile)
const WP = new wordProcesser()
//////////// 讀進所有postlist /////////////
let postlists = fs.readdirSync(`../data/test/`).filter( filename => {
        return filename.slice(-5) === ".json"
    })


async function main(packSize){

    let fanpageList = []
    let result = []
    let isAllDone = false
    let packCount = 0
    let packTotal = 0

    for(let i = 0; i < postlists.length; i++){
        let fanpage = await createFanpage(postlists[i])
        fanpage.standby = fanpage.standby.filter( post => {
            return post.type === 'link' && typeof post.link === 'string'
        })
        packTotal = packTotal + Math.ceil(fanpage.standby.length / packSize)
        fanpageList.push(fanpage)
    }
    

    while( !isAllDone ){

        for(let i = 0; i < fanpageList.length; i++){
            if(fanpageList[i].done) {
                continue
            }
            let postPack = fanpageList[i].takeout(packSize)
            packCount++
            console.log(chalk.blue(`Processing ${fanpageList[i].name}'s postPack ${packCount}/${packTotal}...`))
            for(let postIndex = 0; postIndex < postPack.length; postIndex++){
                sleep(2000)
                let postResult = await extractArticle(postPack[postIndex], fanpageList[i].rules)
                console.log(chalk.blue(`Post ${postResult.id} from ${fanpageList[i].name} is Done`))
                console.log(chalk.cyan(postResult.similarity.ratio))
                fanpageList[i].data.push(postResult)
                fanpageList[i].complete.push(postResult.id)
            
            }
            fanpageList[i].check()
        }

        isAllDone = fanpageList.every( fanpage => {
            return fanpage.done
        })
    }
    console.log(chalk.magenta("Posts Processing are All Done, let's Write in CSV File "))

    fanpageList.sort( (fp1, fp2) => {
        if(fp1.name > fp2.name){
            return 1
        }
        if(fp1.name < fp2.name){
            return -1
        }
        return 0
    })

    fanpageList.forEach( fanpage => {
        if(fanpage.data.length < 2){
            if(fanpage.data.length === 0){
                console.log(chalk.red("[Warning]" + fanpage.name + "Don't have link-type post!!"))
                return
            }
            return
        }
        fanpage.data.sort((p1, p2) => {
            return p2.created_time_ms - p1.created_time_ms
        })
    })
    fs.writeFileSync(`../data/json/result-${since}-${until}-${fanpageList[0].name}.json`, JSON.stringify({data:fanpageList}), 'utf8')

    let json2csvFormat = []
      fanpageList.forEach( fanpage => {
        if(fanpage.data.length === 0) {
            json2csvFormat.push({'紛絲專頁名稱':fanpage.name,'貼文時間':"無link型貼文",'貼文連結':"",'新聞標題':"",'LIKE':'','HAHA':'','ANGRY':'','SAD':'','LOVE':'','WOW':'', '原文連結':"","重疊字":"", "重疊率":"", '匿名消息來源': "", "圖文不符嫌疑":""})
        }else{
            fanpage.data.forEach(( post ) => {
                /*console.log(`{
                    '紛絲專頁名稱': ${page.page_name},
                    '貼文時間': ${post.created_time},
                    '貼文連結': =HYPERLINK("${post.fb_link}"),
                    '原文連結': =HYPERLINK("${post.link}"),
                    '原文關鍵字': ${post.sourceArticle.keywords},
                    '重疊率' : ${post.similarity.ratio.toPrecision(3) * 100},
                    '匿名消息來源' : ${post.anonymousSentences}
                }`)*/
                json2csvFormat.push({
                    '紛絲專頁名稱': fanpage.name,
                    '貼文時間': post.created_time,
                    '貼文連結': `=HYPERLINK("${post.permalink_url}")`/*.replace(/\n|\t|\<.*\>/g,"")*/,
                    '新聞標題': post.name,
                    'LIKE':post.like.summary.total_count,
                    'HAHA':post.haha.summary.total_count,
                    'ANGRY':post.angry.summary.total_count,
                    'SAD':post.sad.summary.total_count,
                    'LOVE':post.love.summary.total_count,
                    'WOW':post.wow.summary.total_count,
                    '原文連結': `=HYPERLINK("${post.link}")`,
                    '重疊字': post.similarity.intersectedWords,
                    '重疊率' : post.similarity.ratio.toPrecision(3) * 100 + "%",
                    '匿名消息來源' : post.anonymousSentences,
                    '圖文不符嫌疑': post.hasDoubtfulImageText.toString()
                })
            })
        }
      })
      //console.log(csv)
      let fields = ['紛絲專頁名稱','貼文時間','貼文連結','新聞標題','LIKE','HAHA','ANGRY','SAD','LOVE','WOW','原文連結', '重疊字', '重疊率', '匿名消息來源', '圖文不符嫌疑']

      let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
      
      fs.writeFile(`../data/csv/result-${since}-${until}-${fanpageList[0].name}.csv`, csv, (err) => {
          if(err) throw err
          console.log("Congradulation!!")
          console.log('Process finished in ' + Math.floor(process.uptime()) + " seconds")
      })
    /*
    fanpageList.forEach(fanpage => {
        console.log(typeof fanpage)
        console.log(fanpage.id)
        console.log(fanpage.name)
        console.log(fanpage.rules)
        console.log(fanpage.standby.length)
    })
    */
}


function extractArticle( post, rules ){

    return new Promise((resolve, reject) => {
        var fuckPNN = /pnn.pts.org.tw|www.cmmedia.com.tw/g
        var url = post.link
        if(fuckPNN.test(post.link)){
            var head = /https:\/\/|http:\/\//g
            var str = post.link
            var headMatched = head.exec(str)
            str = str.slice(head.lastIndex)
            url = headMatched[0] + str.split('/').map((substr) => urlencode(urlencode.decode(substr))).join('/')
        }
        let option = {
            headers: {
                'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36'
            },
            timeout: 100000,
            validateStatus: function (status) {
                return status >= 200 && status < 300 || status === 404; // default
            }
        }

        axios(url, option)
            .then((data) => {

                if(data.status === 404){
                    post.similarity = {intersectedWords:"unknown", ratio: "unknown"}
                    post.hasDoubtfulImageText = "unknown"
                    post.anonymousSentences = "unknown"
                    resolve(post)
                }
                let created_time = new Date(post.created_time)
                const noscriptFilter = /<noscript.+<\/noscript>/g
                data.data.replace(/<noscript.+<\/noscript>/g, "")
                let parser = new NewsParser(data.data, rules)
                post.sourceArticle.raw = parser.getArticle()
                let imagesText = parser.getImagesText()

                post.created_time_ms = created_time.valueOf()
                post.messageWords = WP.stopwordFilter(WP.jieba.extract(WP.punctuactionFilter(post.message), 1000).map( obj => obj.word))
                post.sourceArticle.keywords = WP.stopwordFilter(WP.jieba.extract(WP.punctuactionFilter(post.sourceArticle.raw),1000).map( obj => obj.word))
                post.sourceArticle.words = WP.stopwordFilter(WP.jieba.cut(WP.punctuactionFilter(post.sourceArticle.raw)))
                post.similarity = wordIntersectRatio(post.messageWords, post.sourceArticle.keywords)
                post.anonymousSentences = getAnonymous(post.sourceArticle.raw)
                post.hasDoubtfulImageText = hasDoubtfulImageText(imagesText)
                console.log('Post Keywords: ', post.messageWords)
                console.log('Article Keyword: ', post.sourceArticle.keywords)
                resolve(post)
                 
            }).catch((err) => {
                console.log(chalk.greenBright(`Error occured with this URL : ${url}`))
                console.log(chalk.greenBright(`Error occured with this FB URL : ${post.permalink_url}`))
                reject(err)
            })
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

/////////// 建立所有Fanpage物件 ///////////
function createFanpage(filename){
    return new Promise((resolve, reject) => {
        readFile(`../data/test/` + filename,'utf8')
        .then(data => {
            data = JSON.parse(data)
            let tmp = new Fanpage(data.page_id, data.page_name, data.rules, data.posts)
            resolve(tmp)
        })
        .catch(err => reject(err))
    })
}

/////////// Fanpage物件定義 //////////
function Fanpage( id, name, rules, data ){
    this.id = id || ""
    this.name = name || ""
    this.rules = rules || {article:"", images:""}
    this.standby = data || []
    this.complete = []
    this.data = []
    this.done = false

    //丟出packSize數量的post data
    this.takeout = function( packSize ){
        if(this.standby.length < packSize){
            packSize = this.standby.length
        }
        return this.standby.splice(0,packSize)
    }

    this.isDone = () => this.done

    /** 確認 {this.standby} 是否為空
     * 若為空，將 {this.done} 設為 True
    */
    this.check = function(){
        if(this.standby.length === 0){
            console.log(chalk.magenta(`${this.name} is Done`))
            this.done = true
        }
    }
}

main(25)