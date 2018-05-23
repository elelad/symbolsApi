const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = require('./config/db');
const app = express();
const port = process.env.PORT || 1337;//8000;
var helmet = require('helmet');
var RateLimit = require('express-rate-limit');

//const redisClient = require('redis').createClient();
//const limiter = require('express-limiter')(app, redisClient);
//const firebase = require('./firebase');
//const buildDb = require('./buildDB');
var mLabDb;

var limiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    //windowMs: 10*1000, // 10 seconds
    max: 500, // limit each IP to 100 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    //message: "Too many accounts created from this IP, please try again after an hour"
});

//  apply to all requests
app.use(limiter);

/* redisClient.on("error", function (err) {
    console.log("Error " + err);
}); */


// Limit requests to 100 per hour per ip address.
/* limiter({
  path: '*',
  method: 'all',
  lookup: ['connection.remoteAddress'],
  total: 2,// requessts
  //expire: 1000 * 60 * 60, //per hour
  expire: 1000 * 10, //per 10 seconds
  onRateLimited: (req, res, next) =>{
      console.log('Rate limit exceeded');
    res.status(429);
    res.send('Rate limit exceeded')
  }
}) */







app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static('public'))
app.use(helmet())


/* MongoClient.connect(db.mlabUrlNew, (err, database) => {
    mLabDb = database.db('symbols-test');//mLab
    console.log('mLab db live');
}) */

MongoClient.connect(db.mlabUrlNew, (err, database) => {//mlabUrlNew  mlabUrlNew
    if (err) return console.log(err)
    var myDB = database.db('symbolsapi');//mLab
    //var myDB = database.db('SymbolsDB');//mongoDb Atlas
    require('./app/routes')(app, myDB);
    app.listen(port, () => {
        console.log('We are live on ' + port);
    });

    /* myDB.collection('symbols-lang').dropIndexes();
    myDB.collection('symbols-lang').createIndex(
        { name: "text", "translations.tName": "text" },
        {
            default_language: "none",
            weights: {
                "translations.tName": 10,
                //name: 5
            }
        }
    ); */
    /* myDB.collection('symbols').createIndex(
        { id : 1 }
    ); */
    /* setInterval(()=>{
         let start = myDB.collection('symbols').find({id: 1})
        .project({id: 1})
        .limit(1)
        .sort({id: 1});
        start.toArray().then(res=>{
            console.log(res);
        })

    }, 30000); */
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

