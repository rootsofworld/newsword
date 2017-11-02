/**
 * Input pageName
 * Input page_id
 * Write into config file , if not exist, create it.
 * FileName : sample.json
 */
const fs = require('fs')
const configFileName = "sample.json"

const target = process.argv[2]

////////////MAIN////////////
if(fs.existsSync( configFileName )){

    console.log('File exists, check if target already in the file ... ')
    console.log(`Name: ${newTarget.pageName} \nID: ${newTarget.page_id}`)

    fs.readFile(configFileName,'utf8', (err, content) => {
        if(err) throw err;
        content = JSON.parse(content)


        let checkIfExist = content.targetList.find(( el ) => {
                return el === target
            })

        if(checkIfExist !== undefined){
            console.error("This Page has already in the config file !!")
            return false
        }else{
            console.log("Target is not in the file, let write it. ")
            content.targetList.push(target)
            fs.writeFile(configFileName, JSON.stringify(content),'utf8', (err) => {
                if(err) throw err
            })
        }

    })

}else{

    console.log("File not Found, creating ...")
    let content = {
        targetList : []
    }
    content.targetList.push(target)
    fs.writeFile(configFileName, JSON.stringify(content),'utf8', (err) => {
        if(err) throw err
        console.log(`Config file created, Named: sample.json\nInsert:\n\tName: ${newTarget.pageName} \n\tID: ${newTarget.page_id}
        `)
    })

}