const fs = require('fs')
const util = require('util')
const csv2json = require('csv2json')
var target = 'set'
var readFile = util.promisify(fs.readFile)
var path = '../data/crowdtangle/' + target + '/'
var files = fs.readdirSync(path).filter( filename => {
    return filename.slice(-5) === '.json'
})

var postlist = []
var counter = files.length
files.forEach( file => {
    console.log(counter)
    postlist = postlist.concat(JSON.parse( fs.readFileSync(path + file) ))
    //console.log(postlist)
    counter--
    if(counter === 0) finish()

})

function finish(){
    console.log('Finish')
    console.log("Post count: ", postlist.length)
    postlist = postlist.sort((p1, p2) => {
        return p1["Created Date"] - p2["Created Date"]
    })
    fs.writeFile(`../data/crowdtangle/${target}.json`, JSON.stringify(postlist), 'utf8',(err => {
        if (err) throw err
    }))
}