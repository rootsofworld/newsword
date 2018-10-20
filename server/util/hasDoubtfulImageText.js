function hasDoubtfulImageText( str ){
    const doubtful = /示意|非當事|模擬|與本文無關|設計畫面|合成|翻攝/g
    if(str === "") return "This website don't have image text rule"
    if(doubtful.test(str)){    
        return str.match(doubtful)
    }else{
        return "Don't have doubtful image text"
    }
}

module.exports = hasDoubtfulImageText
