const fs = require('fs');
const util = require('util')
const nlp = require('natural');
const chalk = require('chalk');
const wordProcesser = require('./wordprocesser.js');
const json2csv = require('json2csv')
const corenlp = require('corenlp').default;
const getAnonymous = require('./getAnonymous.js')
const { Properties, Pipeline } = require('corenlp');

const filename = process.argv[2]
const topic = ['年改','年金改革', '軍警', '軍公教']
const wp = new wordProcesser()

const dbPath = '../data/dumbdb-process/';
const readFile = util.promisify(fs.readFile)

async function matchTopic({filename, topic, keywords}){

    var haveKeywords, topicMatchedList, haveArticle;
    
    var data = JSON.parse(await readFile(dbPath + filename))
    var pagename = data.pagename
    //topic = topic.split('\n').map(word => word.trim()).filter(word => word !== '')
    //keywords = keywords.split('\n').map(word => word.trim()).filter(word => word !== '')
    const posts = data.posts
    data.type_1 = {count:0, ratio:0}
    data.type_2 = {count:0, ratio:0}
    data.type_3 = {count:0, ratio:0}
    console.log(chalk.greenBright("Post count: " + posts.length))
    
    haveArticle = posts.filter(post => !!post.article)
    console.log(chalk.greenBright("Post with Article count: " + haveArticle.length))
    
    topicMatchedList = haveArticle.filter(post => {
        return Object.values(wordFinder(post.article, topic)).includes(true)
    })

    topicMatchedList.forEach(post => {
        var article = post.article
        post.type_1 = Object.values(wordFinder(article, keywords['type_1'])).includes(true)
        post.type_2 = Object.values(wordFinder(article, keywords['type_2'])).includes(true)
        post.type_3 = Object.values(wordFinder(article, keywords['type_3'])).includes(true)
        if(post.type_1) data.type_1.count++
        if(post.type_2) data.type_2.count++
        if(post.type_3) data.type_3.count++
    })
    var match_total = data.type_1.count + data.type_2.count + data.type_3.count;
    data.type_1.ratio = (data.type_1.count / match_total * 100).toFixed(1) + '%';
    data.type_2.ratio = (data.type_2.count / match_total * 100).toFixed(1) + '%';
    data.type_3.ratio = (data.type_3.count / match_total * 100).toFixed(1) + '%';
    
    var result = {
        pagename: pagename,
        posts: topicMatchedList,
        type_1: data.type_1,
        type_2: data.type_2,
        type_3: data.type_3
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
        result[word] = filter[word].test(str)
    }
    return result
}




async function matchAllFile({topic, keywords}){
    const pagelist = fs.readdirSync(dbPath).filter(filename => filename.slice('-4') === 'json')
    result = []
    for(page of pagelist){
        console.log(page)
        var tmp = await matchTopic({filename:page, topic: topic, keywords: keywords})
        //console.log('Debug: ' + tmp.topic_matched_articles.length)
        result.push(tmp)
    }
    let json2csvFormat = []
    result.forEach( fanpage => {
    if(fanpage.posts.length === 0) {
        json2csvFormat.push({'紛絲專頁名稱':fanpage.pagename,'貼文時間':"無link型貼文或年改相關新聞",'貼文連結':"",'新聞標題':"",'LIKE':'','HAHA':'','ANGRY':'','SAD':'','LOVE':'','WOW':'', '原文連結':"", "重疊率":"", "第一類":"","第二類":"","第三類":""})
    }else{
        fanpage.posts.forEach( post => {
            /*console.log(`{
                '紛絲專頁名稱': ${page.name},
                '貼文時間': ${post.created_time},
                '貼文連結': =HYPERLINK("${post.fb_link}"),
                '原文連結': =HYPERLINK("${post.link}"),
                '原文關鍵字': ${post.sourceArticle.keywords},
                '重疊率' : ${post.similarity.ratio.toPrecision(3) * 100},
                '匿名消息來源' : ${post.anonymousSentences}
            }`)*/
            json2csvFormat.push({
                '紛絲專頁名稱': fanpage.pagename,
                '貼文時間': post['Created'],
                '貼文連結': `=HYPERLINK("${post['URL']}")`/*.replace(/\n|\t|\<.*\>/g,"")*/,
                '新聞標題': post['Link Text'],
                ////////  if from crowdtangle, use post.{reaction} ///////
                'LIKE':post['Likes'],
                'HAHA':post['Haha'],
                'ANGRY':post['Angry'],
                'SAD':post['Sad'],
                'LOVE':post['Love'],
                'WOW':post['Wow'],
                '分享數':post['Shares'],
                '留言數':post['Comments'],
                //////////////////////////////////////////////////////////
                '原文連結': `=HYPERLINK("${post['Link']}")`,
                '重疊率' : post.similarity.ratio.toPrecision(3) * 100 + "%",
                "第一類": fanpage.type_1.ratio,
                "第二類": fanpage.type_2.ratio,
                "第三類": fanpage.type_3.ratio,
                '匿名消息來源': getAnonymous(post.article)
            })
        })
    }
    })

    let fields = ['紛絲專頁名稱','貼文時間','貼文連結','新聞標題','LIKE','HAHA','ANGRY','SAD','LOVE','WOW', '分享數','留言數', '原文連結', '重疊率', "第一類", "第二類", "第三類",'匿名消息來源']
    let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
    
    fs.writeFile('../data/news-423-427-年改.csv', csv, (err) => {
        if(err) throw err;
        console.log(chalk.greenBright('Done'))
    })
    
    return result
}

var wordList = {
    type_1: ["軍人", "退休警消", "警消", "退警", "退消", "警眷", "軍警", "警方", "警力", "軍公教"],
    type_2: ["總統","總統府","蔡政府","蔡英文","林萬億","段宜康","耿繼文","曾永權","林德福","李彥秀","曾銘宗","盧秀燕","陳學聖","陳慶財","彭昌盛","甘雯","丁守中","張顯耀","鍾小平","林國春","蘇嘉全","邱國正","許俊逸","陳弘毅"],
    type_3: ["退休消防總會","退休警察總會","退休公教總會","中華民國退警總會理事長"]
}

/*
matchTopic({filename:filename, topic:topic, keywords:wordList})
    .then(result => result.length)
*/

matchAllFile({topic: topic, keywords:wordList})
    .then(result => console.log(result.length))

exports.matchTopic = matchTopic
exports.matchAllFile = matchAllFile