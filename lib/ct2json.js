
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
