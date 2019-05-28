require('dotenv').config();
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = process.env.M_LAB_URL_NEW;
const app = express();
const port = process.env.PORT || 1337;//8000;
var helmet = require('helmet');
var RateLimit = require('express-rate-limit');
const https = require('https');


var limiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 100 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: "Too many accounts created from this IP, please try again after 15 minutes"
});
app.use(limiter);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static('public'))
app.use(helmet())

MongoClient.connect(db, (err, database) => {
    if (err) return console.log(err)
    var myDB = database.db('symbolsapi');//mLab
    //var myDB = database.db('SymbolsDB');//mongoDb Atlas
    require('./app/routes')(app, myDB);
    app.listen(port, () => {
        console.log('We are live on ' + port);
    });

    setInterval(()=>{
         let start = myDB.collection('symbols').find({id: 1})
        .project({id: 1})
        .limit(1)
        .sort({id: 1});
        start.toArray().then(res=>{
            //console.log(res);
        })

        https.get('https://symbotalkapiv1.azurewebsites.net', ()=>{
            console.log('keeping the instance alive');
        });

    }, 20000);
})

