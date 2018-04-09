const path = require("path")
const express = require("express")
//const getData = require("./lib/main.js")

let app = express()

app.set('views', './views')
app.set('view engine', 'hbs')


app.get('/', function(req, res){
    res.render("table", getData())
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))

function getData(){
    return {
        media: [
            {
                mediaName: "A",
                pages:[
                    {
                        pageName: "a1",
                        posts:[
                            {
                                Date: "2017-1",
                                postContent: "adsfasfadsf",
                                sourceArticle: "adfasdfasdf",
                                Similarity: "0.25",
                                anonymousSentences: ['aaa','bbb','ccc']
                            },
                            {
                                Date: "2017-2",
                                postContent: "adsfasfadsf",
                                sourceArticle: "adfasdfasdf",
                                Similarity: "0.25",
                                anonymousSentences: ['aaa','bbb','ccc']
                            },
                            {
                                Date: "2017-3",
                                postContent: "adsfasfadsf",
                                sourceArticle: "adfasdfasdf",
                                Similarity: "0.25",
                                anonymousSentences: ['aaa','bbb','ccc']
                            }
                        ]
                    },
                    {
                        pageName: "a2",
                        posts:[
                            {
                                Date: "2017",
                                postContent: "adsfasfadsf",
                                sourceArticle: "adfasdfasdf",
                                Similarity: "0.15",
                                anonymousSentences: ['aaa','bbb','ccc']
                            }
                        ]
                    },
                    {
                        pageName: "a3",
                        posts:[
                            {
                                Date: "2017",
                                postContent: "adsfasfadsf",
                                sourceArticle: "adfasdfasdf",
                                Similarity: "0.48",
                                anonymousSentences: ['aaa','bbb','ccc']
                            }
                        ]
                    }
                ]
            },
            {
                mediaName: "B",
                pages:[
                    {
                        pageName: "b1",
                        posts:[
                            {
                                Date: "2017",
                                postContent: "adsfasfadsf",
                                sourceArticle: "adfasdfasdf",
                                Similarity: "0.25",
                                anonymousSentences: ['aaa','bbb','ccc']
                            }
                        ]
                    }
                ]
            },
            {
                mediaName: "C",
                pages:[
                    {
                        pageName: "c1",
                        posts:[
                            {
                                Date: "2017",
                                postContent: "adsfasfadsf",
                                sourceArticle: "adfasdfasdf",
                                Similarity: "0.25",
                                anonymousSentences: ['aaa','bbb','ccc']
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
