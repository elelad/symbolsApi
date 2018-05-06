
console.log(jQuery);
const c = {};

c.searchUrl = "https://symbotalkapiv1.azurewebsites.net/search/";
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
            html += `
            <li class="list-group-item d-flex flex-row p-0 pr-3">
                <div class="p-1">
                    <img alt="symbol" src="${data[i].image_url}" class="symbolThomb shadow-sm rounded" />
                </div>
                <div class="flex-grow-1 pt-2">
                    <h3>${data[i].name}</h3>
                    <p>${data[i].name}</p>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-danger" type="button">More</button>
                </div>
            </li>
        `
        }/* translations[0].tName */
    }
    $('#sResults').html(html);
    $('#loading').hide();
}