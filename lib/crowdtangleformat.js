const fs = require('fs')
const util = require('util')
const chalk = require('chalk')
const pageList = require('../config/pageList.json')

var readFile = util.promisify(fs.readFile)

var files = fs.readdirSync('../data/crowdtangle').filter( filename => {
    return filename.slice(-5) === '.json'
})
//console.log(files)

files.forEach( file => {
    let pagedataRaw = fs.readFileSync('../data/crowdtangle/' + file, 'utf8')
    let pagedata = Pagedata(JSON.parse(pagedataRaw))
    //console.log(pagedata)
    fs.writeFile(`../data/test/posts-2018-02-07-2018-02-11-${pagedata["name"]}.json`,
        JSON.stringify(pagedata),
        'utf8',
        (err) => {
            if( err ) throw err
            console.log(chalk.blue(`${pagedata.name}'s postList is done`))
            console.log(chalk.cyan("Posts total : " + pagedata.posts.length))
            console.log(chalk.cyan("TypeCounter: "))
            console.log(chalk.cyan(`\tLink : ${pagedata.typeCount.link}`))
            console.log(chalk.cyan(`\tVideo : ${pagedata.typeCount.video}`))
            console.log(chalk.cyan(`\tPhoto : ${pagedata.typeCount.photo}`))
            console.log(chalk.cyan(`\tStatus : ${pagedata.typeCount.status}`))
            console.log(chalk.cyan(`\tEvent : ${pagedata.typeCount.event}`))
            if(pagedata.typeCount.link === 0)
                console.log(chalk.red("[Warning] Don't have link-type post!!"))
            console.log(chalk.magenta("///////////////////////////////////////////////////"))
        }
    )
    //console.log(pagedata.length)
})


function Pagedata( pageDataFromCT ){
    const page = pageList.targets.filter(page =>  page.name === pageDataFromCT[0]["Page Name"])[0]
    let postList = {
        id: page.id,
        name: page.name,
        rules: page.rules,
        posts:[],
        typeCount:{
            link: 0,
            video: 0,
            photo: 0,
            status: 0,
            event: 0
        }
    }
    console.log(postList)
    pageDataFromCT.forEach(post => {
        postList.typeCount.link = (post["Type"] === "link") ? postList.typeCount.link + 1 : postList.typeCount.link
        postList.posts.push({
            id: post["Post URL"].split('/')[-1],
            type: post["Type"],
            name: post["Title"],
            created_time: post["Created Date"],
            message: post["Message"],
            link: post["Link URL"],
            message_tags: [],
            permalink_url: post["Post URL"],
            description: post["Description"],
            caption: post["Caption"],
            like:post["Likes"],
            haha:post["Haha"],
            wow:post["Wow"],
            sad:post["Sad"],
            angry:post["Angry"],
            love:post["Love"],
            comments:post["Comments"],
            sourceArticle: {
                raw: "",
                words: []
            },
            messageWords: []
        })
    })
    return postList
}