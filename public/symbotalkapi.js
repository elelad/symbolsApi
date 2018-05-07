
console.log(jQuery);
var c = {};
c.data = [];

c.searchUrl = "https://symbotalkapiv1.azurewebsites.net/search/";
c.symbolUrl = "https://symbotalkapiv1.azurewebsites.net/symbols/";
//c.searchUrl = "localhost:1337/search/";

c.search = function () {
    //$('#sResults').html()
    $('#loading').show();
    let html = "<span class='center'><i class='fas fa-spinner fa-lg fa-pulse'></i></span>";
    $('#sResults').html(html);
    let q = $('#query').val();
    let lang = $('#langSelect').val();
    console.log(lang);
    let repo = $('#symbolsSelect').val();
    console.log(repo);
    let limit = $('#limitSelect').val();
    console.log(limit);
    let url = c.searchUrl + '?name=' + q + '&repo=' + repo + '&lang=' + lang + '&limit=' + limit;
    console.log(url);
    $.ajax({
        url: url,
        success: c.dataToHtml
    })

}

c.dataToHtml = function (data) {
    console.log(data);
    c.data = data;
    var html = "";
    if (data == "no query") {
        html = "<span class='center'>Please search something...</span>"
    } else if(data == 'no result'){
        html = "<span class='center'>No  result...</span>"
    }else if(data.error){
        html = "<span class='center'>An error has occurred, please try agein later...</span>"
    }
    else {
        for (let i = 0; i < data.length; i++) {
            console.log("for i: " + i);
            //console.log(data[i].translations[0].tName);
            let id = data[i].id;
            let name = (data[i].translations) ? (data[i].translations[0].tName) : data[i].name;
            html += `
            <li class="list-group-item d-flex flex-row p-0 pr-3">
                <div class="p-1">
                    <img alt="symbol" src="${data[i].image_url}" class="symbolThomb shadow-sm rounded" />
                </div>
                <div class="flex-grow-1 pt-2 pl-3">
                    <h5>${name}</h5>
                    <h6>From: ${data[i].repo_key}</h6>
                    <p>License: ${data[i].license}</p>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-danger" type="button" onClick="c.more(${data[i].id})">More</button>
                </div>
            </li>
        `
        }/*  */
    }
    $('#sResults').html(html);
    $('#loading').hide();
}

c.idToHtml = function(data){
    console.log(data);
}

c.more = function(id){
    console.log(id);
    $.ajax({
        url: c.symbolUrl + id,
        success: c.idToHtml
    })
}