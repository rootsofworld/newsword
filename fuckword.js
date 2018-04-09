const fs = require("fs")
const json2csv = require("json2csv")
const chalk = require('chalk')

var dir = fs.readdirSync(process.argv[2]).filter( filename => {
    return filename.slice(-5) === ".json"
})//'./data/chingte'
//console.log(dir)
var posts = dir.map( file => {
    return JSON.parse(fs.readFileSync(process.argv[2] + '/' + file,'utf8'))
})

var target = process.argv[2].split('/')

posts = posts.map( post => {
    var fuckwordList = ["淦話","贛話","豪洨","豪肖","嘴砲","唬爛","虎爛","鬼話","鬼扯","扯蛋","馬的","幹！","淦！","贛！","他媽","你媽的","妳媽的","幹話", "功德","台南","臺南", "勞工", "過勞", "勞基法", "加油", "缺德", "屁", "媽的", "幹", "最軟"]
    var fuckwordStat = {}
    for( fuckword of fuckwordList ){
        fuckwordStat[fuckword] = 0
    }
    var commentsCount = 0
    var comments = post.comments.context.map(comment => {
        commentsCount++
        if(comment.comments){
            comment.comments = comment.comments.map( subcomment => {
                commentsCount++
                let hasFuckword = wordFinder(subcomment.message, fuckwordList)
                for( fuckword of fuckwordList ){
                    if(hasFuckword[fuckword]) fuckwordStat[fuckword]++
                }
                return Object.assign(subcomment, {hasFuckword: hasFuckword})
            })
        }
        let hasFuckword = wordFinder(comment.message, fuckwordList)
        for( fuckword of fuckwordList ){
            if(hasFuckword[fuckword]) fuckwordStat[fuckword]++
        }
        return Object.assign(comment, {hasFuckword: hasFuckword})
    }) //Object Array
    
    return Object.assign(post, {comments: comments, commentsCount: commentsCount, fuckwordStat: fuckwordStat}) 
    
})

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


makePostTable(posts)


function makeCommenTable(posts){
    let stat = {page: target[target.length-1], posts:[]}
    let json2csvFormat = []
    posts.forEach( post => {
        var isFirst = true
        stat.posts.push({
            "貼文時間": post.created_time,
            "貼文連結": `https://www.facebook.com/${post.id}`,
            "貼文反應": post.reactions,
            "留言數量": post.commentsCount,
            "幹話統計": post.fuckwordStat
        })
        fs.writeFileSync(`./data/${target[target.length-1]}-20170701-20171231.json`,JSON.stringify(stat) ,'utf8')
        console.log(chalk.magenta("Posts time : ", post.created_time))
        console.log("Comments Count : ", post.commentsCount)
        console.log("Fuckword_Stat : ", post.fuckwordStat)
        if(post.commentsCount === 0) {
            json2csvFormat.push({'貼文':post.id,'貼文時間':post.created_time,'貼文連結':post.permalink_url, "第二層留言":"無留言","留言內容":"無留言", "留言時間": "無留言", "留言連結": "無留言", "出現幹話": "","讚數":"0"})
        }else{
            post.comments.forEach( comment => {
                json2csvFormat.push({
                    '貼文': isFirst ? post.message : "    ▼",
                    '貼文時間': post.created_time,
                    '貼文連結': `=HYPERLINK("https://www.facebook.com/${post.id}")`/*.replace(/\n|\t|\<.*\>/g,"")*/,
                    '留言層級': '◇',
                    '留言內容': comment.message,
                    '留言時間': subcomment.created_time,
                    '留言連結' : `=HYPERLINK("https://www.facebook.com/${comment.id}")`,
                    '出現幹話' : Object.entries(comment.hasFuckword).map(p => p[1] ? p[0] : "").filter(p => p !== ""),
                    '讚數':comment.like_count
                })
                if(comment.comments){
                    comment.comments.forEach( subcomment => {
                        json2csvFormat.push({
                            '貼文': "    ▼",
                            '貼文時間': post.created_time,
                            '貼文連結': `=HYPERLINK("https://www.facebook.com/${post.id}")`/*.replace(/\n|\t|\<.*\>/g,"")*/,
                            '留言層級': '◈',
                            '留言內容': subcomment.message,
                            '留言時間': subcomment.created_time,
                            '留言連結' : `=HYPERLINK("https://www.facebook.com/${subcomment.id}")`,
                            '出現幹話' : Object.entries(subcomment.hasFuckword).map(p => p[1] ? p[0] : "").filter(p => p !== ""),
                            '讚數':subcomment.like_count
                        })
                    })
                }
                isFirst = false
            })
        }
    })
    //console.log(csv)
    let fields = ['貼文','貼文時間','貼文連結','留言層級', '留言內容', '留言時間', '留言連結', '出現幹話','讚數']
    let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
    fs.writeFile(`./data/${target[target.length-1]}-20170701-20180131-fuckword.csv`, csv, (err) => {
        if(err) throw err
        console.log("Congradulation!!")
        console.log('Process finished in ' + Math.floor(process.uptime()) + " seconds")
    })
}

function makePostTable(posts){
    let stat = {page: target[target.length-1], posts:[]}
    let json2csvFormat = []
    posts.forEach( post => {
        console.log(chalk.magenta("Posts time : ", post.created_time))
        console.log("Comments Count : ", post.commentsCount)
        console.log("Fuckword_Stat : ", post.fuckwordStat)
        json2csvFormat.push({
            '貼文': post.message,
            '貼文時間': post.created_time,
            '貼文連結': `=HYPERLINK("https://www.facebook.com/${post.id}")`,
            'LIKE': post.reactions.like,
            'HAHA': post.reactions.haha,
            'ANGRY': post.reactions.angry,
            'SAD': post.reactions.sad,
            'LOVE': post.reactions.love,
            'WOW': post.reactions.wow,
            '留言數': post.commentsCount,
            '幹話統計-TOP 5': Object.entries(post.fuckwordStat).sort((a, b) => b[1] - a[1]).slice(0, 5)
        })
                
    })
    let fields = ['貼文','貼文ID','貼文時間','貼文連結','LIKE','HAHA','ANGRY','SAD','LOVE','WOW','留言數','幹話統計-TOP 5']
    let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
    fs.writeFile(`./data/${target[target.length-1]}-20170701-20180131-poststat.csv`, csv, (err) => {
        if(err) throw err
        console.log("Congradulation!!")
        console.log('Process finished in ' + Math.floor(process.uptime()) + " seconds")
    })
}