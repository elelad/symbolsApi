
//const tCLi = require('@google-cloud/translate')({ keyFilename: './SymboTalk-28a623274f93.json' });
var ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
const adminToken = "symbotalk7777";
var path = require('path');
const supportedLanguages = ['da', 'nl', 'en','fi','fr','de','hu','it','nb','pt','ro','ru','es','sv','tr']
//var stopWords = require('../../data/stopwords/en.txt');

module.exports = function (app, db) {


    app.get('/symbols/:id', (req, res) => {
        const id = req.params.id;
        console.log(id);
        //const details = { '_id': new ObjectID(id) };
        const details = { 'id': +id };
        db.collection('symbols').findOne(details)
            .then((item) => {
                console.log(item);
                if (!item) {
                    res.send({ 'error': 'An error has occurred' });
                } else {
                    res.send(item);
                }
            }).catch(e => console.log(e));
    });



    app.get('/search', (req, res) => {
        console.log(req.query);
        var query = req.query.name || "";
        if (query == "") {
            res.send('no query');
            return;
        }
        var lang = req.query.lang || "en";
        console.log(lang);
        var repo = req.query.repo || "all";
        console.log(repo);
        var limit = +req.query.limit || 50;
        if (limit > 50) limit = 50;
        console.log(limit);
        query = query.toLowerCase();
        console.log(query);
        
        let detectedLang = lang;
        let langForText =  (supportedLanguages.includes(lang))? lang : 'none';
        let data = fs.readFileSync(path.join(__dirname,'../stop_words/' + langForText + '.txt'));
        console.log('data.includes(query):');
        console.log(data.includes(query));
        
        let curser = db.collection('symbols')
            .find({
                repo_key: (repo != "all") ? { $eq: repo } : { $ne: "" }, //{$regex :}
                $text: { $language: langForText, $search: query } //'none'lang
            })
            .limit(limit)
            .project({
                score: { $meta: "textScore" }, "name": 1, "license": 1, "license_url": 1, "author": 1, "author_url": 1, "repo_key": 1, "image_url": 1, "alt_url": 1, "search_string": 1, "id": 1, //"extension": 1, "_id": 1, //"translations": { $slice: -1 }, , "translations.tLang" : 0
                translations: { $elemMatch: { tLang: detectedLang } }//{ tLang : {$regex : ".*iw.*"}}}//
            })//tName: {"translations.tLang" : {$regex : ".*iw.*"}}
            .sort({ score: { $meta: "textScore" } });
        curser.toArray().then(arr => {
            console.log("found " + arr.length + " results");
            if (arr.length == 0) {
                let newCurser = db.collection('symbols').find(
                    {
                        "name":
                            (query == 'a') ? query : { $regex: ".*" + query + ".*" }
                    }).limit(limit)
                    .project({
                        score: { $meta: "textScore" }, "name": 1, "license": 1, "license_url": 1, "author": 1, "author_url": 1, "repo_key": 1, "image_url": 1, "alt_url": 1, "search_string": 1, //"extension": 1, "_id": 1, //"translations": { $slice: -1 }, , "translations.tLang" : 0
                        translations: { $elemMatch: { tLang: detectedLang } }//{ tLang : {$regex : ".*iw.*"}}}//
                    })
                    .sort({ score: { $meta: "textScore" } });
                newCurser.toArray().then(newArr => {
                    console.log("found " + newArr.length + " results");
                    if (newArr.length == 0) {
                        res.send('no result');
                    } else {
                        res.send(newArr);
                    }
                }).catch(e => {
                    console.log(e);
                    res.send({ 'error': 'An error has occurred' });
                });
                //res.send('no result');
            } else {

                res.send(arr);
            }
        }).catch(e => {
            console.log(e);
            res.send({ 'error': 'An error has occurred' });
        });
        //});
    });

    app.post('/symbols', (req, res) => {
        // You'll create your note here.
        console.log(req.body);
        //console.log(req.query);
        const symbol = { name: req.body.name, img_src: req.body.img_src };
        db.collection('symbols').insert(symbol, (err, result) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
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

    app.put('/symbols/:id', (req, res) => {
        const id = { id: +req.params.id }; //+to convert string to number
        //console.log(id);
        //console.log(req.body.name);
        const token = req.headers.token;
        //console.log(token);

        if (!token || token != adminToken) {
            return res.send('Not authorized');
        }
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
            return res.send({ 'error': 'Not a Symbol' });
        } else {
            console.log('symbol');
            //res.send('symbol');
            db.collection('symbols').update(id, symbol, { upsert: true }).then((d) => {//, 
                console.log('symbol ' + symbol.id + ' updated on the new db');
                res.send('Update Done');
            }).catch(e => {
                res.send({ 'error': 'An error has occurred ' + e });
                //errorsArray.push(doc.id);
                //console.log(errorsArray);
            });
        }
    });

    app.get('/', (req, res) => {
        res.send('Welcome to SymboTalk API V1');
        //dir = "public";
        //res.sendFile(path.join(__dirname + '../../../public/index.html'));
    });
};