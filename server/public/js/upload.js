(function(){

    let uploader = document.getElementById('file-input')
    let uploadButton = document.getElementById('file-upload')

    uploadButton.addEventListener('click', function(evt){
        uploader.click()
        
    })

    uploader.addEventListener('change', uploadHandler, false);

    function uploadHandler(evt){
        let files = Array.from(evt.target.files)
        console.log(files[0].name)
        if(files.some( file => file.name.split('.').slice(-1)[0] !== 'csv')){
            alert("Please only upload CSV file !!")
            return
        }

        let totalSize = files.map(f => f.size).reduce((a, c) => a + c)
        let progressWrapper = document.querySelector('.upload-state')
        let progress = new ProgressBar(progressWrapper)
        
        progress.init(totalSize)
        
        let count = files.length
        for(let i = 0; i < files.length; i++){
            
            let xhr = new XMLHttpRequest()
            let fd = new FormData()
            fd.append('file', files[i])

            xhr.upload.onloadstart = function(e){
                console.log(`${files[i].name} start uploading`)
                xhr.loaded = 0
            }

            xhr.upload.onprogress = function(e){
                progress.going(e, xhr.loaded)
                xhr.loaded = e.loaded
            }

            xhr.upload.onloadend = function(e){
                if(--count === 0){
                    progress.end(e)
                }
                console.log(`${files[i].name} uploaded`)
            }

            //TODO: Exception Handle
            xhr.upload.ontimeout = function(e){
                progress.error(e)
            }

            xhr.upload.onerror = function(e){
                progress.error(e)
            }

            xhr.upload.onabort = function(e){
                progress.error(e)
            }
            ///////////////////

            xhr.onload = function(e){
                console.log(xhr.responseText)
            }

            xhr.timeout = 10000
            xhr.open('POST', '/upload', true)
            xhr.send(fd)

        }

        /* Read file into memory
        for(let i = 0; i < files.length; i++){
            let reader = new FileReader()   

            reader.onloadstart = function(evt){
                console.log(`${files[i].name} start`)
                reader.loaded = 0
            }

            reader.onerror = errorHandler

            reader.onprogress = function(evt){
                progress.going(evt, reader.loaded)
            }

            reader.onloadend = function(evt){
                progress.end(evt)
                sendFile(evt.target.result)
                console.log(`${files[i].name} end`)
            }

            reader.readAsText(files[i])
        }
        */
    }

    class ProgressBar {
        constructor(wrapper){
            this.progress = 0;
            this.loaderUI = {};
            this.wrapper = wrapper;
            this.total = 0;
            this.loadedTotal = 0;
        }

        /**
         * Create progress and message element
         * @param {number} totalSize : fileList total bytesize
         */
        init(totalSize){

            if(this.wrapper.hasChildNodes()){
                this.wrapper.innerHTML = ""
            }

            this.total = totalSize

            let progress = createElementFromHTML(
                `<div class="progress">
                    <div class="determinate" style="width: 0%"></div>
                </div>`)
            let message = document.createElement('div')
            message.setAttribute('class', 'message')
            message.textContent = "0%"
            this.loaderUI.progress = progress
            this.loaderUI.message = message
            this.wrapper.appendChild(progress)
            this.wrapper.appendChild(message)
            console.log("init end")
        }

        //Called when FileReader.onprogress event emit
        //For progress bar updating
        going(evt, loaded){
            let delta = evt.loaded - loaded
            this.loadedTotal += delta

            this.progress = Math.round((this.loadedTotal / this.total) * 100 )
            //BUG: In some cases, progress will over 100
            console.log("Progress: " + this.progress)

            this.loaderUI.progress.querySelector('.determinate').style.width = this.progress + "%"
            this.loaderUI.message.textContent = this.progress + '%'
        }

        end(evt){
            this.progress = "100%"
            this.loaderUI.message.textContent = "Success"
        }

        //TODO:
        error(e){
            console.log(e)
        }

    }

    function createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        // Change this to div.childNodes to support multiple top-level nodes
        return div.firstChild; 
      }

    function errorHandler(err){
        console.log(err)
    }

    function sendFile(file){

        let xhr = new XMLHttpRequest()
        let uri = '/upload'

        xhr.open('post', uri, true)
    }

})()