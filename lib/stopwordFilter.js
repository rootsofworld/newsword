const fs = require('fs')
//const stopwordArr = require('../config/stopwords.json').data

var stopwordFilter = (arr) => {
    var data = fs.readFileSync('../config/stopwords.txt','utf8')
    var stopwordArr = data.split('\n')
    return arr.filter(x => !stopwordArr.includes(x))
}

module.exports = stopwordFilter