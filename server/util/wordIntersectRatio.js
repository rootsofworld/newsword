function wordIntersectRatio(source, target){

    if( !Array.isArray(source) || !Array.isArray(target) ){
        console.log("Source and Target must be words array")
        return -1
    }

    source = Array.from(new Set(source))
    target = Array.from(new Set(target))
    //console.log('source: ' + source.length)
    if(source.length === 0){
        return {
            intersectedWords: [],
            ratio: 0
        }
    }
    let intersected = source.map((word) => {
        return target.includes(word) ? 1 : 0
    })

    let intersectCounts = intersected.reduce((acc, el) => {
        return acc + el
    })

    let intersectedWords = source.filter((word, i) => {
        return intersected[i]
    })

    return {
        intersectedWords: intersectedWords,
        ratio: intersectCounts / source.length
    }
}

module.exports = wordIntersectRatio