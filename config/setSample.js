/**
 * Input pageName
 * Input page_id
 * Write into config file , if not exist, create it.
 * 
 */
const fs = require('fs')
const program = require('commander')
const configFileName = "pageList.json"

program
    .version('0.0.1')
    .usage('Set fb page infomation and crawler rules for post-new comparation')
    .option('-P, --pageid [value]', 'FB Page ID')
    .option('-N, --pagename [value]', 'FB Page Name')
    //.option('-T, --title [value]', 'Rule to get News Title')
    //.option('-D, --date [value]', 'Rule to get News Date')
    .option('-A, --article [value]', 'Rule to get News Article')
    //.option('-S, --author [value]', 'Rule to get News Author')
    .option('-I, --images [value]', 'Rule to get News Images ')
    //.option('-V, --videos [value]', 'Rule to get News Videos')
    .parse(process.argv)

const target = {
    page_name: program.pagename,
    page_id: program.pageid,
    rules: {
        //title: program.title,
        //date: program.date,
        article: program.article,
        //author: program.author,
        images: program.images
        //videos: program.videos
    }
}

console.log(target)

if(fs.existsSync( configFileName )){
    if(target.page_name === target.page_id){
        console.error('Parameters have wrong format')
        return false
    }
    console.log('Already Had Config File, Now Insert New Target ')
    console.log(`Name: ${target.page_name} \nID: ${target.page_id}`)

    fs.readFile(configFileName,'utf8', (err, content) => {
        if(err) throw err;
        content = JSON.parse(content)


        let original = content.targets.findIndex(( el ) => {
                return el.page_id === target.page_id
            })

        if( original >= 0 ){
            console.log("This Page has already in the config file ~~~, Let's Overwrite it")
            content.targets[original] = target
            fs.writeFile(configFileName, JSON.stringify(content),'utf8', (err) => {
                if(err) throw err
            })
        }else{
            console.log("Target is not in the file, Let's write it. ")
            content.targets.push(target)
            fs.writeFile(configFileName, JSON.stringify(content),'utf8', (err) => {
                if(err) throw err
            })
        }

    })

}else{

    console.log("Config file not Found, Creating the new One ")
    let content = {
        targets : []
    }
    content.targets.push(target)
    fs.writeFile(configFileName, JSON.stringify(content),'utf8', (err) => {
        if(err) throw err
        console.log(`Config file created, Named: pageList.json\nInsert:\n\tName: ${target.page_name} \n\tID: ${target.page_id}
        `)
    })

}