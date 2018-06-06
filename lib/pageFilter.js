/*
設定一個固定路徑的資料夾當作儲存點(假資料庫) : ../data/dumbdb
把CT抓下來的資料夾(以粉專為單位)集中放到一個母資料夾
母資料夾的路徑作為此腳本的輸入
=> 遍歷所有粉專的資料夾
=> 個別將每個粉專資料夾內的csv檔串接轉成json，用檔案中的粉專名稱＋hashCode(粉專名稱)當做輸出檔名
=> 輸出到儲存點
儲存點內的每個檔案代表一個粉專在某段時間的所有貼文
TODO:
處理個別粉專資料夾
將儲存點內的檔案依照粉絲團做：
1.合併
2.照時間排序
3.刪除重複貼文
*/
const fs = require('fs');
const util = require('util');
const csv = require('csvtojson');

var fsFuncList = ['readFile', 'writeFile', 'readdir', 'mkdir'];
const {readFile, writeFile, readdir, mkdir} = ((funcs) => {
    var funcSet = {}
    funcs.forEach(func => {
        funcSet[func] = util.promisify(fs[func])
    });
    return funcSet;
})(fsFuncList);

const inputPath = process.argv[2];
const outputPath = '../data/dumbdb-init';
const rootDir = fs.readdirSync(inputPath).filter(file => {
    return fs.statSync(inputPath + '/' + file).isDirectory()
});
//console.log(rootDir)

console.log(rootDir.length)
rootDir.forEach(async fanpageDir => {
    var path = inputPath + '/' + fanpageDir;
    var posts = []
    const files = await readdir(path)
    var pagename = ""
    var count = 0
    files.filter(file => file.slice(-3) === 'csv')
         .forEach(async (file, index, files) => {
             
            var json = await csv().fromFile( path + '/' + file )
            
             pagename = json[0].Name
             //console.log(json)
             posts.push(json)
             count++
             if(count === files.length){
                 try{
                     console.log(pagename, posts.length)
                     await writeFile(outputPath+'/'+pagename+'.json', JSON.stringify(postsMerge(posts,pagename)),'utf8')
                 }catch(err){
                     console.error(err)
                 }
            }
         });
    
    //console.log(files)
    //fs.writeFile();
});

function postsMerge(postlist, pagename){
    var posts = postlist.reduce((acc, next) => acc.concat(next))
    //console.log(pagename)
    return {
        pagename:pagename,
        posts:posts.sort(sortByTime)
    }
}

function sortByTime(p1, p2){
    p1 = new Date(p1['Created'].split(' ').slice(0,2).join('T'))
    p2 = new Date(p2['Created'].split(' ').slice(0,2).join('T'))
    //console.log(p1.getTime(),p2.getTime())
    return p2.getTime() - p1.getTime()
}
