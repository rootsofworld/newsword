function extractArticle( url ){
    let source = {}
     rp(url)
        .then((body) => {

            $ = cheerio.load(body)
            source.body = body
            source.pList = $('p')
            source.pList
            //let mainSection = $(`.${className}`)
            console.log(source.pList.length)
            /*for(let i = 0; i < source.pList.length; i++){
                if(i % 2 === 0)
                    console.log(chalk.yellowBright(source.pList[i].children[0].data))
                    console.log(chalk.redBright(source.pList[i].children[0].data))
            }*/
            return source
        })
    
}