//const stopwordArr = require('../config/stopwords.json').data

var stopwordFilter = (arr, dict) => {
    var stopwordArr = dict.split('\n')
    return arr.filter(x => !stopwordArr.includes(x))
}

module.exports = stopwordFilter