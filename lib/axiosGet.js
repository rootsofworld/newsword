const axios = require('axios')

/**
 * @async
 * @param {String} url 
 * /////// make the request ///////
 */
function axiosGet(url){
    return new Promise((resolve, reject) => {
        axios.get(url, {
            headers:{
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
            },
            timeout: 3000
        })
        .then(data => {
            //console.log(data)
            resolve(data)
            return data
        })
        .catch( err => reject(err))
    })
}

module.exports = axiosGet