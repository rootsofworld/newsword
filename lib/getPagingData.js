/**
 * USE TO GET PAGING DATA OBJECT - Ex: Pages, Comments, Reactions
 * @param {*} 
 * @param {*} page-id 
 * @param {*} 
 * @param {*} time
 */

async function getPagingData(url, id, name, rules){
    /////// Data Init ////////
    let postList = {
        page_id: id,
        page_name: name,
        rules: rules,
        posts:[],
        typeCount:{
            link: 0,
            video: 0,
            photo: 0,
            status: 0,
            event: 0
        }
    }

    console.log(chalk.magenta("///////////////////////////////////////////////////"))
    console.log(chalk.magenta(`Getting ${name}'s postList`))
    console.log(chalk.magenta("Paging ..."))

    ////////// Process First Page ///////////
    let firstPage = await getPage(url)
    firstPage.data.posts.data.forEach( el => {
        postList.posts.push( el )
    })
    //////// If Not Just Have One Page ////////
    if(firstPage.data.posts.paging.next !== undefined){
        
        ////////// Process Other Pages //////////
        let currentPage = await getPage(firstPage.data.posts.paging.next)
        currentPage.data.data.forEach( el => {
            postList.posts.push(el)
        })
        while(currentPage.data.paging.next !== undefined){
            currentPage = await getPage(currentPage.data.paging.next)
            currentPage.data.data.forEach( el => {
                postList.posts.push(el)
            })
        }
    }
}