
//const tCLi = require('@google-cloud/translate')({ keyFilename: './SymboTalk-28a623274f93.json' });
var ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
const dbConfig = require('../../config/db');
const adminToken = dbConfig.myToken;
var path = require('path');
const supportedLanguagesForMongoSearch = ['da', 'nl', 'en', 'fi', 'fr', 'de', 'hu', 'it', 'nb', 'pt', 'ro', 'ru', 'es', 'sv', 'tr'];
const symbolsTranslationsLanguages = ['en', 'fi', 'el', 'ro', 'sk', 'iw', 'fr', 'de', 'es', 'pt', 'ru', 'ja', 'sv', 'nl', 'da', 'hu', 'pl', 'no', 'ko', 'th', 'tr', 'cs', 'ar'];
const supportedRepos = ['all', 'arasaac', 'sclera', 'mulberry', 'tawasol'];
const collection = "symbols-lang";//symbols
const request = require("request");
//const supportedLanguages = ['da', 'nl', 'en', 'fi', 'fr', 'de', 'hu', 'it', 'nb', 'pt', 'ro', 'ru', 'es', 'sv', 'tr'];

//var stopWords = require('../../data/stopwords/en.txt');

module.exports = function (app, db) {

    app.get('/symbols/:id', validateId);
    app.get('/symbols/:id', (req, res) => {
        const id = req.params.id;
        console.log(id);
        //const details = { '_id': new ObjectID(id) };
        const details = { 'id': +id };
        db.collection(collection).findOne(details, {
            fields: {
                //"name": 1, "license": 1, "license_url": 1, "author": 1, "author_url": 1, "repo_key": 1, "image_url": 1, "alt_url": 1, "id": 1, "translations": 1,
                "_id": 0
            }
        })
            .then((item) => {
                console.log(item);
                if (!item) {
                    res.status(200);
                    res.send('no symbols found');
                } else {
                    res.status(200);
                    res.send(item);
                }
            }).catch(e => {
                console.log(e);
                res.status(500);
                res.send('An error has occurred');
            });
    });

    app.get('/search', validateSearch);
    app.get('/search', async (req, res) => {
        //console.log(req.query);
        // ------ Get prams form qouery -------
        var query = req.query.name || "";

        var repo = req.query.repo || "all";
        if (!supportedRepos.includes(repo)) {
            repo = "all";
        }

        //console.log(repo);
        var limit = +req.query.limit || 20;
        if (limit > 50) limit = 50; // Limit is limited to max 50 results defalut is 20
        //console.log(limit);
        //query = query.toLowerCase();
        //console.log(query);
        var lang = req.query.lang || "en";

        //console.log(lang);
        let detectedLang = (symbolsTranslationsLanguages.includes(lang)) ? lang : "en"; // language to retrun at symbol (if not supprted then english)
        let langForText = (supportedLanguagesForMongoSearch.includes(lang)) ? lang : 'none'; // language for mongo text search, if not supprted then do text search without stimming and stp words
        let isStopWord = false;
        if ((supportedLanguagesForMongoSearch.includes(lang))) {
            let data = fs.readFileSync(path.join(__dirname, '../stop_words/' + langForText + '.txt'));
            //console.log('data.includes(query):');
            //console.log(data.includes(query));
            isStopWord = data.includes(query);
        }
        if (query.length == 1 || Number.isInteger(+query)) isStopWord = true; // if user searching one letter or number then set it as stopWord
        if (isStopWord) langForText = "none";
        let curser;
        if (!isStopWord) {
            console.log('not stop word, langForText: ' + langForText);
            console.log('Searching: ' + query);
            curser = db.collection(collection)
                .find({
                    repo_key: (repo != "all") ? { $eq: repo } : { $ne: "" }, //{$regex :}
                    $text: { $language: langForText, $search: query, $diacriticSensitive: true },//'none'lang
                })
                .limit(limit)
                .project({
                    score: { $meta: "textScore" }, "name": 1, "license": 1, "license_url": 1, "author": 1, "repo_key": 1, "image_url": 1, "alt_url": 1, "id": 1, //"search_string": 1,  "extension": 1, "_id": 1,"author_url": 1,  //"translations": { $slice: -1 }, , "translations.tLang" : 0
                    translations: { $elemMatch: { tLang: detectedLang } }//{ tLang : {$regex : ".*iw.*"}}}//
                })//tName: {"translations.tLang" : {$regex : ".*iw.*"}}
                .sort({ score: { $meta: "textScore" } })
            //.maxTimeMS(500);
        } /* else if(query.length == 1) {
            console.log('one letter');
            curser = db.collection('symbols').find(
                {$or: [{ "name": query}, { "name": query.toLowerCase()}, { "name": query.toUpperCase()}, { "name": "letter" + query}, { "name": "number" + query}] }
                ).limit(limit)
                .project({
                    "name": 1, "license": 1, "license_url": 1, "author": 1, "author_url": 1, "repo_key": 1, "image_url": 1, "alt_url": 1, "search_string": 1, //"extension": 1, "_id": 1, //"translations": { $slice: -1 }, , "translations.tLang" : 0
                    translations: { $elemMatch: { tLang: detectedLang } },//len: { $strLenBytes: "$name"  }, 
                     //{ tLang : {$regex : ".*iw.*"}}}//
                })
                //.sort({ len: -1 });//: { $strLenBytes: "$name" } 
            
        } */ else {
            console.log('stop word');
            console.log(query.toUpperCase());
            console.log(query.toLowerCase());
            curser = db.collection(collection)
                .find({
                    repo_key: (repo != "all") ? { $eq: repo } : { $ne: "" }, //{$regex :}
                    "translations": { $elemMatch: { tLang: detectedLang, tName: { $regex: "(^|\ )" + "(" + query + "|" + query.toLowerCase() + "|" + query.toUpperCase() + ")" + "($|\ ).*" } } },
                    ///"translations.tName": {$regex: "(^|\ )" + query + "($|\ ).*"}//".*" +
                    //$text: { $language: langForText, $search: query },//'none'lang
                    //name: query,
                    //"translations.tName": query
                })
                .limit(70)//limit
                .project({
                    score: { $meta: "textScore" }, "name": 1, "license": 1, "license_url": 1, "author": 1, "author_url": 1, "repo_key": 1, "image_url": 1, "alt_url": 1, "id": 1, //"search_string": 1,  "extension": 1, "_id": 1, //"translations": { $slice: -1 }, , "translations.tLang" : 0
                    translations: { $elemMatch: { tLang: detectedLang } }//{ tLang : {$regex : ".*iw.*"}}}//
                })//tName: {"translations.tLang" : {$regex : ".*iw.*"}}
                .maxTimeMS(500);
            //.sort({ score: { $meta: "textScore" } });
            /* curser = db.collection('symbols').aggregate([
                { $match: {name: query}},//(query == 'a') ? query : { $regex: ".*" + query + ".*" } 
                { $project: { "name": 1, "license": 1, "license_url": 1, "author": 1, "author_url": 1, "repo_key": 1, "image_url": 1, "alt_url": 1, "search_string": 1, //"extension": 1, "_id": 1, //"translations": { $slice: -1 }, , "translations.tLang" : 0
                translations: { $elemMatch: { tLang: detectedLang } }, len: { $strLenBytes: "$name" } } },
                { $limit: limit },
                {$sort: {len: -1} }
            ]) */
        }
        curser.toArray().then(arr => {
            console.log("found " + arr.length + " results");
            if (arr.length == 0) {
                //let newCurser =
                //newCurser.toArray().then(newArr => {
                //console.log("found " + newArr.length + " results");
                //if (newArr.length == 0) {
                //res.status(480);
                res.status(200);
                res.send('no result');
                //} else {
                //res.send(newArr);
                //}
                /* }).catch(e => {
                    console.log(e);
                    res.send({ 'error': 'An error has occurred' });
                }); */
                //res.send('no result');
            } else {
                if (isStopWord) {
                    arr.sort((a, b) => {
                        if (a.name.length > b.name.length) {
                            return 1;
                        } else if (a.name.length < b.name.length) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                }
                arr = arr.slice(0, limit);
                res.status(200);
                res.send(arr);
            }
        }).catch(e => {
            console.log(e);
            res.status(500);
            res.send('An error has occurred');
            //res.send({ 'error': 'An error has occurred: /n' + e });
        });
        //});
    });

    app.get('/arasaac', validateSearch);
    app.get('/arasaac', async (req, res) => {
        var query = req.query.name || "";
        var limit = +req.query.limit || 20;
        if (limit > 50) limit = 50; // Limit is limited to max 50 results defalut is 20
        var lang = req.query.lang || "en";
        let symbols = await searchArasaac(query, lang, limit).catch(e => {
            res.status(500);
            res.send('An error has occurred');
        })
        res.status(200);
        return res.send(symbols);

    });

    app.post('*', auth);
    app.post('/symbols', (req, res) => {
        // You'll create your note here.
        console.log(req.body);
        //console.log(req.query);
        const symbol = { name: req.body.name, img_src: req.body.img_src };
        db.collection(collection).insert(symbol, (err, result) => {
            if (err) {
                res.status(500);
                res.send('An error has occurred');
            } else {
                res.status(200);
                res.send(result.ops[0]);
            }
        });
    });


    /* app.delete('/symbols/:id', (req, res) => {
        const id = req.params.id;
        const details = { '_id': new ObjectID(id) };
        db.collection('symbols').remove(details, (err, item) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send('Note ' + id + ' deleted!');
            }
        });
    }); */
    app.put('*', auth);
    app.put('/symbols/:id', (req, res) => {
        const id = { id: +req.params.id }; //+to convert string to number
        //console.log(id);
        //console.log(req.body.name);

        const symbol = {
            //_id: req.body._id,
            id: req.body.id,
            name: req.body.name,
            license: req.body.license,
            license_url: req.body.license_url,
            author: req.body.author,
            author_url: req.body.author_url,
            source_url: req.body.source_url,
            repo_key: req.body.repo_key,
            extension: req.body.extension,
            image_url: req.body.image_url, // 'https://storage.googleapis.com/symbols/' + req.body.repo_key + '/' + req.body.name + '.' + req.body.extension
            alt_url: req.body.alt_url,
            search_string: req.body.search_string,
            unsafe_result: (req.body.unsafe_result == undefined) ? false : req.body.unsafe_result,
            translations: req.body.translations
        };
        //console.log(symbol);
        if (!symbol.id || !symbol.name || !symbol.license || !symbol.license_url || !symbol.author || !symbol.author_url //!symbol._id || 
            || !symbol.repo_key || !symbol.extension || !symbol.image_url || !symbol.alt_url
            || !symbol.search_string || !symbol.unsafe_result.toString() || !symbol.translations //|| !symbol.source_url 
        ) {
            res.status(400);
            return res.send({ 'error': 'Not a Symbol' });
        } else {
            console.log('symbol');
            //res.send('symbol');
            db.collection(collection).update(id, symbol, { upsert: true }).then((d) => {//, 
                console.log('symbol ' + symbol.id + ' updated on the new db');
                res.status(200);
                res.send('Update Done');
            }).catch(e => {
                res.status(500);
                res.send('An error has occurred');
                //errorsArray.push(doc.id);
                //console.log(errorsArray);
            });
        }
    });

    app.get('/', (req, res) => {
        res.status(200);
        res.send('Welcome to SymboTalk API, for more data go to our docs: https://elelad.github.io/SymboTalkAPIDocs');
        //dir = "public";
        //res.sendFile(path.join(__dirname + '../../../public/index.html'));
    });

    app.get('*', function (req, res) {
        res.status(401);
        res.send('no such path, for more data go to our docs: https://elelad.github.io/SymboTalkAPIDocs');
    });
};

function validateId(req, res, next) {
    const idNum = +req.params.id;

    if (!Number.isInteger(idNum)) {
        res.status(400);
        res.send('id must be an integer number');
    } else if (idNum > 99999 || idNum < 0) {
        res.status(400);
        res.send('id must be between 0 to 99999');
    } else {
        next();
    }
}

function validateSearch(req, res, next) {
    var query = req.query.name || "";
    if (query == "") { // if no query then out
        res.status(400);
        res.send('no query');
        return;
    } else if (query.length > 30) {
        res.status(400);
        res.send('too large query');
        return;
    } else {
        next();
    }
}

function auth(req, res, next) {
    const token = req.headers.token;
    //console.log(token);
    if (!token || token != adminToken) {
        res.status(401);
        return res.send('Not authorized');
    } else {
        next();
    }
}

function searchArasaac(query, lang, limit) {
    return new Promise((res, rej) => {
        console.log('arasaac search started');
        if (limit > 50) limit = 50; // Limit is limited to max 50 results defalut is 20
        var options = {
            method: 'GET',
            url: 'https://api.arasaac.org/api/pictograms/' + lang + '/search/' + query,
            /* headers:
                {
                    
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }, */
        };

        request(options, function (error, response, body) {
            if (error) return rej(error);
            //console.log(body);
            res(arasaacToSymbol(JSON.parse(body)));
        });
    })
}

function arasaacToSymbol(arasaacResults) {
    let symbols = [];
    arasaacResults.forEach(ara => {
        let symbol = {
            name: ara.keywords[0].keyword,
            license: ara.license,
            license_url: "",
            author: ara.authors[0].name,
            author_url: ara.authors[0].url,
            source_url: 'https://static.arasaac.org/pictograms/' + ara.idPictogram + '_2500.png',
            repo_key: 'arasaac',
            extension: 'png',
            image_url: 'https://static.arasaac.org/pictograms/' + ara.idPictogram + '_300.png',
            alt_url: 'https://static.arasaac.org/pictograms/' + ara.idPictogram + '_500.png',
            unsafe_result: false,
        }
        symbols.push(symbol);
    })
    console.log(symbols);
    return symbols;
}