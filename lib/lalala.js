const json2csv = require('json2csv')
const fs = require('fs')

const file = process.argv[2]
const data = JSON.parse(fs.readFileSync(file, 'utf8')) 
toCSV(data)
function toCSV(data){
    let json2csvFormat = []
    data.forEach( post => {
        /*
        if(post.postKeywords && post.articleKeywords){
            stat.post_keyword_count = stat.post_keyword_count + post.postKeywords.length
            stat.article_keyword_count = stat.article_keyword_count + post.articleKeywords.length
            stat.similarity_avg = stat.similarity_avg + post.similarity.ratio
        }
        */
        json2csvFormat.push({
            '紛絲專頁名稱': post["Name"],
            '貼文時間': new Date(post['Created'].split(' ').slice(0, -1)).toLocaleString(),
            '貼文連結': `=HYPERLINK("${post['URL']}")`/*.replace(/\n|\t|\<.*\>/g,"")*/,
            '新聞標題': post['Link Text'],
            '新聞大綱': post['Description'],
            ////////  if from crowdtangle, use post.{reaction} ///////
            'LIKE': post['Likes'],
            'HAHA': post['Haha'],
            'ANGRY': post['Angry'],
            'SAD': post['Sad'],
            'LOVE': post['Love'],
            'WOW': post['Wow'],
            '分享數': post['Shares'],
            '留言數': post['Comments'],
            'CT Score': post['Score'],
            //////////////////////////////////////////////////////////
            '貼文內容': post['Message'],
            '原文內容': post['article'],
            '原文連結': `=HYPERLINK("${post['Link']}")`,
            '貼文關鍵字': post.postKeywords,
            '原文關鍵字': post.articleKeywords,
            '重疊字': (post.similarity) ? post.similarity.intersectedWords : "",
            '重疊率' : (post.similarity) ? post.similarity.ratio.toPrecision(3) * 100 + "%" : 0,
        })
    })

    let fields = ['紛絲專頁名稱','貼文時間','貼文連結','新聞標題','新聞大綱','LIKE','HAHA','ANGRY','SAD','LOVE','WOW', '分享數','留言數', 'CT Score','貼文內容','原文內容','原文連結', '貼文關鍵字','原文關鍵字','重疊字','重疊率']
    let csv = json2csv({data:json2csvFormat, fields: fields, withBOM: true})
    
    fs.writeFile(`${file.split('.')[0]}.csv`, csv, (err) => {
        if(err) throw err;
    })
    
}
