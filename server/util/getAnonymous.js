function getAnonymousSentences( str ){

    let anonymousSentences = [] //String
    const target = /外傳|據傳|據表示|據指出|高層|可靠消息來源|據透漏|權威人士|知情人士|當局|鄉民表示|網友表示|不願具名|不具名|爆料|據悉|據了解|據現場了解|傳出|文內提到|業者表示/g
    if(target.test(str)){    
        let matchesCount = str.match(target).length
        while(matchesCount--){
            
        anonymousSentences.push(getSentence(target.exec(str).index))

        }

        function getSentence(matchIndex){ //return String
            let ending = /。|｡/
            let rangeStr = str.slice(matchIndex)
            return str.slice(matchIndex, matchIndex + rangeStr.search(ending))
        }
        //console.log(anonymousSentences)
        return anonymousSentences
    }else{
        return "Don't have Anonymous words"
    }
}

/*
var testStr = `據悉，小嫻日前對友人透露「恢復單身」，和何守正已在1個月前秘密離婚；

小嫻以簡訊回應媒體：「我看了要一直忍住眼淚，我目前不回應，

可能要麻煩你去問何先生了」。


據《壹週刊》報導，經過連日跟拍，發現兩人早已分居，

何守正昨晚當面回應週刊：「我知道你們都很辛苦，

可是有的東西我們之後會再統一說明啦。」對於婚變，

他則表示：「你們應該都跟到了，就是這樣了吧。」


據指出，外傳離婚原因與小嫻不孕、引起婆婆不滿有關，

何守正苦笑說：「你們很會猜耶。」否認傳宗接代壓力導致婚變；

但一被問到是否有新對象？他竟頓了一下，才欲言又止回答：「辛苦了。」

沒承認也沒否認，似乎透露出婚變內幕。


對此，本報致電小嫻、何守正，兩人都未接電話，簡訊則已讀不回，

暫時無法取得回應。`
getAnonymousSentences(testStr)
*/

module.exports = getAnonymousSentences