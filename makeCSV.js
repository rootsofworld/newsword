const fs = require('fs')


function makeCSV( data ){




    fs.writeFile(`/data/news-${data.since}-${data.until}.csv`, PWW(data), 'utf8',( err ) => {
        if( err ) throw err
    })    
}


function PWW( data ){

    let csvString = data.map(( page ) => {

					return `${page.data.answerId}, ${page.data.userId}, ${data.result.score}, ${data.time}`;

				})

}