const fs = require('fs');
const util = require('util')
const nlp = require('natural');
const chalk = require('chalk');
const wordProcesser = require('./wordprocesser.js');
const json2csv = require('json2csv')
const corenlp = require('corenlp').default;
const getAnonymous = require('./getAnonymous.js')
const { Properties, Pipeline } = require('corenlp');

//const filename = process.argv[2]
//const topic = ['年改','年金改革', '軍警', '軍公教']
const wp = new wordProcesser()

const dbPath = '../data/earthquake_result/';
const readFile = util.promisify(fs.readFile)

async function matchTopic({filename, topic, keywords}){

    var haveKeywords, topicMatchedList, haveArticle;
    
    var data = JSON.parse(await readFile(dbPath + filename))
    var pagename = data.pagename
    //topic = topic.split('\n').map(word => word.trim()).filter(word => word !== '')
    //keywords = keywords.split('\n').map(word => word.trim()).filter(word => word !== '')
    const posts = data.posts
    data.type_1 = {count:0, ratio:0, detail: (() => {var r = {};wordList['type_1'].forEach(word => r[word] = {have:false, count:0});return r})()}
    data.type_2 = {count:0, ratio:0, detail: (() => {var r = {};wordList['type_2'].forEach(word => r[word] = {have:false, count:0});return r})()}
    data.type_3 = {count:0, ratio:0, detail: (() => {var r = {};wordList['type_3'].forEach(word => r[word] = {have:false, count:0});return r})()}
    data.type_4 = {count:0, ratio:0, detail: (() => {var r = {};wordList['type_4'].forEach(word => r[word] = {have:false, count:0});return r})()}
    console.log(chalk.greenBright("Post count: " + posts.length))
    
    haveArticle = posts.filter(post => !!post.article)
    console.log(chalk.greenBright("Post with Article count: " + haveArticle.length))
    /*
    topicMatchedList = haveArticle.filter(post => {
        return Object.values(wordFinder(post.article, topic)).map(el => el.have).includes(true)
    })
    */
    
   haveArticle.forEach(post => {
        var article = post.article
        post.type_1 = wordFinder(article, keywords['type_1'])
        post.type_2 = wordFinder(article, keywords['type_2'])
        post.type_3 = wordFinder(article, keywords['type_3'])
        post.type_4 = wordFinder(article, keywords['type_4'])
        
        for(let i = 1; i <= typecount; i++){
            for(word in post['type_' + i]){
                data['type_' + i].detail[word].count += post['type_' + i][word].count
                data['type_' + i].detail[word].have = (data['type_' + i].detail[word].count > 0)
            }
        }
        
        data.type_1.count = data.type_1.count + Object.values(post.type_1).map(el => el.count).reduce((acc, curr) => acc + curr)
        data.type_2.count = data.type_2.count + Object.values(post.type_2).map(el => el.count).reduce((acc, curr) => acc + curr)
        data.type_3.count = data.type_3.count + Object.values(post.type_3).map(el => el.count).reduce((acc, curr) => acc + curr)
        data.type_4.count = data.type_4.count + Object.values(post.type_4).map(el => el.count).reduce((acc, curr) => acc + curr)
        
    })
    var totalList = []
    var match_total = 0
    for(let i = 1; i <= typecount; i++){
        var d = data['type_' + i].detail
        for(word in d){
            if(!totalList.includes(word)){
                totalList.push(word)
                match_total = match_total + d[word].count
            }
        }
    }

    console.log('type 1: ' + data.type_1.count)
    console.log('type 2: ' + data.type_2.count)
    console.log('type 3: ' + data.type_3.count)
    console.log('type 4: ' + data.type_4.count)
    console.log('Total: ' + match_total)
    data.type_1.ratio = (data.type_1.count / match_total * 100).toFixed(1) + '%';
    data.type_2.ratio = (data.type_2.count / match_total * 100).toFixed(1) + '%';
    data.type_3.ratio = (data.type_3.count / match_total * 100).toFixed(1) + '%';
    data.type_4.ratio = (data.type_4.count / match_total * 100).toFixed(1) + '%';
    
    var result = {
        pagename: pagename,
        posts: haveArticle,
        post_total: haveArticle.length || 0,
        haveLinkType: "Link",//(topicMatchedList.length !== 0),
        haveTopicMatched: true,//(topicMatchedList.length !== 0),
        type_1: data.type_1,
        type_2: data.type_2,
        type_3: data.type_3,
        type_4: data.type_4
    }
    //console.log(result)
    /*
    haveKeywords = topicMatchedList.filter(post => {
        //post.keywords = wp.stopwordFilter(wp.jieba.extract(wp.punctuactionFilter(post.article),10).map( obj => obj.word))
        var words = wordFinder(post.article, keywords)
        post.keywords = []
        for(word in words){
            if(words[word])post.keywords.push(word)
        }
        if(post.keywords.length > 0){
            //console.log('['+post.keywords+']'+'\n'+post['Link Text']+'\n'+post['Link']+'\n'+'////')
            return true;
        }else{
            return false
        }
    })
    */
    //console.log(chalk.greenBright("Topic Matched: " + topicMatchedList.length))
    //console.log(chalk.greenBright("Have Keywords: " + haveKeywords.length))
    return result
    
}

function wordFinder(str, wordList){
    var filter = {}
    for( word of wordList ){
        filter[word] = new RegExp(word, 'g')
    }
    var result = {}
    for( word of wordList ){
        var have = filter[word].test(str)
        result[word] = {
            have: have,
            count: have ? str.match(filter[word]).length : 0
        }
    }
    return result
}

async function matchAllFile({topic, keywords}){
    const pagelist = fs.readdirSync(dbPath).filter(filename => filename.slice('-4') === 'json')
    result = []
    //var post_total = 0
    stat = {
        post_keyword_count: 0,
        article_keyword_count: 0,
        total: 0,
        topicmatchtotal: 0,
        similarity_avg: 0
    }
    for(page of pagelist){
        console.log(page)
        var tmp = await matchTopic({filename:page, topic: topic, keywords: keywords})
        //console.log('Debug: ' + tmp.topic_matched_articles.length)
        result.push(tmp)
    }
    
    function toCSV(){
        let json2csvFormat = []
        result.forEach( fanpage => {
        if( !fanpage.haveLinkType ) {
            json2csvFormat.push({'紛絲專頁名稱':fanpage.pagename,'貼文時間':"無link型貼文",'貼文連結':"",'新聞標題':"",'LIKE':'','HAHA':'','ANGRY':'','SAD':'','LOVE':'','WOW':'', '原文連結':"", "重疊率":"", "名人":"","政府＆政治人物":"","受難者":"","其他/專家學者":""})
        }else if( !fanpage.haveTopicMatched ){
            json2csvFormat.push({'紛絲專頁名稱':fanpage.pagename,'貼文時間':"無年改相關新聞",'貼文連結':"",'新聞標題':"",'LIKE':'','HAHA':'','ANGRY':'','SAD':'','LOVE':'','WOW':'', '原文連結':"", "重疊率":"", "名人":"","政府＆政治人物":"","受難者":"","其他/專家學者":"",})
        }else{
            console.log("AAA: " + fanpage.posts.length)
            stat.total = stat.total + fanpage.post_total
            stat.topicmatchtotal = stat.topicmatchtotal + fanpage.posts.length
            fanpage.posts.forEach( post => {
                if(post.postKeywords && post.articleKeywords){
                    stat.post_keyword_count = stat.post_keyword_count + post.postKeywords.length
                    stat.article_keyword_count = stat.article_keyword_count + post.articleKeywords.length
                    stat.similarity_avg = stat.similarity_avg + post.similarity.ratio
                }

                json2csvFormat.push({
                    '紛絲專頁名稱': fanpage.pagename,
                    '貼文時間': new Date(post['Created'].split(' ').slice(0, -1)).toLocaleString(),
                    '貼文連結': `=HYPERLINK("${post['URL']}")`/*.replace(/\n|\t|\<.*\>/g,"")*/,
                    '新聞標題': post['Link Text'],
                    ////////  if from crowdtangle, use post.{reaction} ///////
                    'LIKE':post['Likes'],
                    'HAHA':post['Haha'],
                    'ANGRY':post['Angry'],
                    'SAD':post['Sad'],
                    'LOVE':post['Love'],
                    'WOW':post['Wow'],
                    //'分享數':post['Shares'],
                    //'留言數':post['Comments'],
                    //////////////////////////////////////////////////////////
                    '原文連結': `=HYPERLINK("${post['Link']}")`,
                    '重疊率' : (post.similarity) ? post.similarity.ratio.toPrecision(3) * 100 + "%" : 0,
                    "名人": fanpage.type_1.ratio || '',
                    "政府＆政治人物": fanpage.type_2.ratio || '',
                    "受難者": fanpage.type_3.ratio || '',
                    "其他/專家學者": fanpage.type_4.ratio || '',
                    "匿名消息來源": getAnonymous(post.article)
                })
            })
        }
        })

        stat.similarity_avg = stat.similarity_avg / stat.topicmatchtotal
        let fields = ['紛絲專頁名稱','貼文時間','貼文連結','新聞標題','LIKE','HAHA','ANGRY','SAD','LOVE','WOW', /*'分享數','留言數',*/ '原文連結', '重疊率', "名人", "政府＆政治人物", "受難者", "其他/專家學者",'匿名消息來源']
        let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
        /*
        fs.writeFile('../data/news-207-211-花蓮強震.csv', csv, (err) => {
            if(err) throw err;
            console.log(chalk.greenBright('Done'))
        })
        */

        console.log(stat)

    }
    toCSV()
    return result
}


//花蓮強震關鍵字

var wordList = {
    type_1: ["郭彥甫","館長","陳之漢","老王","雅虎日本","五月天","阿部寬","楊丞琳","林依晨","張惠妹","周杰倫","林志玲","蕭敬騰","郭采潔","KID","杜詩梅","蕭薔","詹詠然","張震嶽","廖人帥","周子瑜","聖結石","Hebe","王仁甫"],
    type_2: ["經濟部","內政部","勞動部","公路總局","安倍晉三","蔡英文","賴清德","傅崐萁","李鴻源","徐國勇","王欣儀","葉俊榮","梅健華","安峰山"],
    type_3: ["周志軒","梁書瑋","丁守慧","丁文昌","何鳳華","楊浩然","楊捷","李昇隆","江振昌","林麗貞","劉東騰","美樂蒂","余妃","李昇隆","陳明輝","大久保淑珉"],
    type_4: ["酈永剛","王明仁","李富城","林吳亮廷","徐冠榮","李淑玲","黃武龍","周瑞祥","花蓮縣消防局第一大隊長朱哲民","蕭煥章","黎蕾","黃世建","溫士忠","郭鎧紋","韓非諭","陳國昌","李錫堤"]
}


//年改事件關鍵字
/*
var wordList = {
    //支持年改+反反年改
    type_1: ["總統","總統府","蔡政府","蔡英文","林萬億","蘇嘉全","邱國正","丁守中","段宜康","全國傳播媒體產業工會","衛星公會新聞自律委員會","詹怡宜","記者黎冠志","蔡英文","賴清德","柯文哲","蘇嘉全","徐國勇","徐永明","吳斯懷"],
    //反對年改
    type_2: ["軍人","退休警消","警消","退警","退消","警眷","軍警","警方","警力","軍公教","李彥秀","許俊逸","陳弘毅","耿繼文","曾永權","林國春","鍾小平","林德福","曾銘宗","陳學聖","盧秀燕","張顯耀","退休消防總會","退休警察總會","退休公教總會","中華民國退警總會理事"],
    //立場不明
    type_3: ["陳慶財","彭昌盛","甘雯"],
    //反記者被打
    type_4: ["全國傳播媒體產業工會","衛星公會新聞自律委員會","詹怡宜","記者黎冠志","蔡英文","賴清德","柯文哲","蘇嘉全","徐國勇","徐永明","吳斯懷"]
}
*/
var typecount = Object.keys(wordList).length

/*
var wordList = {
    type_1: ["軍人", "退休警消", "警消", "退警", "退消", "警眷", "軍警", "警方", "警力", "軍公教"],
    type_2: ["總統","總統府","蔡政府","蔡英文","林萬億","段宜康","耿繼文","曾永權","林德福","李彥秀","曾銘宗","盧秀燕","陳學聖","陳慶財","彭昌盛","甘雯","丁守中","張顯耀","鍾小平","林國春","蘇嘉全","邱國正","許俊逸","陳弘毅"],
    type_3: ["退休消防總會","退休警察總會","退休公教總會","中華民國退警總會理事長"]
}
*/

/*
matchTopic({filename:filename, topic:topic, keywords:wordList})
    .then(result => result.length)
*/

matchAllFile({/*topic: topic,*/ keywords:wordList})
    .then(result => console.log(result.length))

exports.matchTopic = matchTopic
exports.matchAllFile = matchAllFile