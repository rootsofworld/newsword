const request = require('request')

for(let i = 0; i < 10; i++){

    setTimeout(wake,i * 1000)
   
}

function wake(){
    request('https://www.bnext.com.tw/article/46443/googles-wavenet-machine-learning-based-speech-synthesis-comes-to-assistant',(err, body) => {
        if(err) throw err

        console.log(body.body)
        console.log('//////////////////////////////////////////////////////////////////////')  
    })
}