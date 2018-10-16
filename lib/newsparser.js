const cheerio = require('cheerio')

function NewsParser( body, rules){
    this.$ = cheerio.load(body) || {}
    this.rules = rules
}



NewsParser.prototype.getArticle = function(){
    const rule = this.rules.article
    const $ = this.$
    if(rule === undefined){
        console.log("Rule is undefined")
        //if don't have rule, get every text in p tag
        /////////////////////////////////////////////
        let pList = $('p')
        let pTagArray = []
        for(let i = 0; i < pList.length; i++){
            if(pList[i].children[0]) {
                pTagArray.push(pList[i].children[0].data)
            }else{
                pTagArray.push("")
            }
        }
        return pTagArray.join('\n')

    }else{
        if(this.rules.branch){
            let branch_rule = this.rules.branch[1]
            if(branch_rule){
                if($(branch_rule).text()) return $(branch_rule).text()
            }else{
                console.log("ERR : branch should have rule")
                return false
            }
        }
        return $(rule).text()
    
    }
}


NewsParser.prototype.getImagesText = function(){
    const rule = this.rules.images
    const $ = this.$
    const linkTextExtractor = />.+(?=<\/a>)/g
    if(!rule){
        //console.log("This website's ImageText don't have rule")
        return ""
    }
    /*
    const imageHTML = $(rule).html()
    let linkText = imageHTML.match(linkTextExtractor)
    return imageHTML.replace(/<.+>/g, linkText[0].slice(1))
    */
    return $(rule).text()
}




NewsParser.prototype.extract = function(){
    const rules = this.rules
    const $ = this.$
    return {
        //title = getTitle(rules.title),
        //author = getAuthor(rules.author),
        //date = getDate(rules.date),
        article : this.getArticle(),
        images : this.getImagesText() // {url, title}
        //videos = getVideos(rules.videos) // {url, title}
    }
}

module.exports = NewsParser