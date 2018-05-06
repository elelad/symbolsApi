const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = require('./config/db');
const app = express();
//const firebase = require('./firebase');
//const buildDb = require('./buildDB');
var mLabDb;


const port = process.env.PORT || 1337;//8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static('public'))


/* MongoClient.connect(db.mlabUrlNew, (err, database) => {
    mLabDb = database.db('symbols-test');//mLab
    console.log('mLab db live');
}) */

MongoClient.connect(db.mlabUrlNew, (err, database) => {//mlabUrlNew
    if (err) return console.log(err)
    var myDB = database.db('symbolsapi');//mLab
    //var myDB = database.db('SymbolsDB');//mongoDb Atlas
    require('./app/routes')(app, myDB);
    app.listen(port, () => {
        console.log('We are live on ' + port);
    });
    //myDB.collection('symbols').dropIndexes();
    /* myDB.collection('symbols').createIndex(
        { name : "text", "translations.tName" : "text" },
        { default_language: "none" }
    );  */
    /* myDB.collection('symbols').createIndex(
        { "translations.tName" : "text" }
    ); */
    //buildDb.buildJson(myDB);
    //buildDb.buildJsonWithTrans(myDB);
    //buildDb.buildJsonWithTransAsync(myDB);
    //buildDb.buildJsonWithTransAsync(myDB);
    //buildDb.downloadSymbols();
    /* buildDb.msTranslate('אני הולך', 'en', 'he').then(data=>{
        console.log(data);
    }); */
    //buildDb.setBW(myDB);
    //buildDb.fixFromArray(myDB);
    //buildDb.updateDBfromJson(myDB);
    //buildDb.updateTrans(myDB);
    //buildDb.testReq();
    /* setTimeout(()=>{
        buildDb.copyToDB(myDB, mLabDb);
    }, 2000); */
})

//buildDb.translate();
//buildDb.buildJsonWithTrans();
//buildDb.buildJson();

//findAtFirebase('Art lesson');

