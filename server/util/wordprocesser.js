const nodejieba = require('nodejieba')
const fs = require('fs')
const path = require('path')

nodejieba.load({
    dict: nodejieba.DEFAULT_DICT,
    hmmDict: nodejieba.DEFAULT_HMM_DICT,
    userDict: path.resolve('../server/config/dict.txt.big'),
    idfDict: nodejieba.DEFAULT_IDF_DICT,
    stopWordDict: path.resolve('../server/config/stopwords.txt'),
  });

function wordProcesser(){

    const stopwordDic = fs.readFileSync(path.resolve('../server/config/stopwords.txt'), 'utf8')

    this.extract = nodejieba.extract
    this.cut = nodejieba.cut

    /*//////////////////////////////
    this.hashtagFilter = function(){

    }
    */

    this.punctuactionFilter = function punctuactionFilter(str){
        if(!str) return
        str = str.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g," ")
        str = str.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\—|\－|\」|\「|\！|\（|\）|\。|\，|\：|\、|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\？|\n]/g," ")
        return str
    }

    this.stopwordFilter = function stopwordFilter(arr){
        var stopwordArr = stopwordDic.split('\n')
        return arr.filter(x => !stopwordArr.includes(x))
    }

}



module.exports = wordProcesser