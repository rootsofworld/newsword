(function(){

    
    $('.sidenav').sidenav();
    


    let fd = new FormData();
    let dataChecker = {
        keywords: "empty",
        from: "empty",
        to: "empty"
    }
    let sendButton = document.getElementById('send');
    
    sendButton.addEventListener('click', function(e){
        

        if(dataChecker.from === "empty" | dataChecker.to === "empty"){
            alert("Date Cannot be empty")
        }

        for(el of fd.entries()) console.log(el)
        
        $.ajax({
            url:'/data',
            method: 'POST',
            data: fd,
            processData: false,
            cache: false,
            contentType: false,
            success: function(res){
                var data = res;
                console.log(data)
                updateTable(data)
            }
        })
        
    })

    ///////////////////
    //  Date input  //
    //////////////////
    let from = document.getElementById('date-from')
    let to = document.getElementById('date-to')

    from.onchange = function(e){

        dataChecker.from = e.target.value
        fd.set("from", e.target.value)

        //Set "To" input min
        let date = e.target.value.split('-')
        date[2] = parseInt(date[2], 10) + 2
        let toMinDate = new Date(date)
        to.min = toMinDate.toISOString().split('T')[0]
    }


    to.onchange = function(e){

        dataChecker.to = e.target.value
        fd.set("to", e.target.value)

        //Set "From" input max
        let date = e.target.value.split('-')
        let fromMaxDate = new Date(date)
        from.max = fromMaxDate.toISOString().split('T')[0]
    }

    ////// Date Input End //////


    ///////////////////
    // Keyword input //
    //////////////////
    let keywords = []
    let keywordInput = $("#keyword-input")
    
    $('#keywords-form').submit(function(e){
        let keyword = keywordInput.val().trim()
        console.log(keyword.length)
        if(keyword === ""){
            keywordInput.val("")
            return;
        }else if(keywords.includes(keyword)){
            keywordInput.val("")
            return;
        }
        keywords.push(keyword)
        $(`<div class="keyword">
                <span>${keyword}</span>
                <i class="tiny material-icons clear">clear</i>
            </div>`).click(function(){
                //console.log($(this))
                keywords.pop($(this)[0].children[0].textContent)
                $(this).remove()
            }).appendTo('#keywords')
        keywordInput.val("")
        
        dataChecker.keywords = keywords
        fd.set('keywords', keywords)

        e.preventDefault()
    })    
    
    ////// Keyword input End //////



    //Display Data
    function updateTable(data){
        console.log('update the table')
        var columnDefs = [
            {headerName: "Name", field: "name"},
            {headerName: "CrawlState", field: "crawlState"},
            {headerName: "Created", field: "created"},
            {headerName: "Type", field: "type"},
            {headerName: "LinkText", field: "linkText"},
            {headerName: "Message", field: "message"},
            {headerName: "Likes", field: "likes"},
            {headerName: "Comments", field: "comments"},
            {headerName: "Shares", field: "shares"},
            {headerName: "Love", field: "love"},
            {headerName: "Wow", field: "wow"},
            {headerName: "Haha", field: "haha"},
            {headerName: "Sad", field: "sad"},
            {headerName: "Angry", field: "angry"},
            {headerName: "Thankful", field: "thankful"},
            {headerName: "PostViews", field: "postViews"},
            {headerName: "TotalViews", field: "totalViews"},
            {headerName: "SizeAtPosting", field: "sizeAtPosting"},
            {headerName: "VideoShareStatus", field: "videoShareStatus"},
            {headerName: "Url", field: "url"},
            {headerName: "Link", field: "link"},
            {headerName: "Score", field: "score"}
          ];
      
          // let the grid know which columns and what data to use
          var gridOptions = {
            columnDefs: columnDefs,
            enableSorting: true,
            enableFilter: true
          };
      
        // lookup the container we want the Grid to use
        var eGridDiv = document.querySelector('#data-table');
        var dataCount = document.querySelector('#data-count span')
        var placeholder = document.querySelector('.placeholder')
        placeholder.style.display = none;

        dataCount.textContent = data.length
        // create the grid passing in the div to use together with the columns & data we want to use
        new agGrid.Grid(eGridDiv, gridOptions);
        
        gridOptions.api.setRowData(data);
    }


})()