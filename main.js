const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
var uuid = require('uuid');
const MongoClient = require("mongodb").MongoClient;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use('/static', express.static('public'));
const mongoClient = new MongoClient(process.env.mongo_str);
//   const mongoClient = new MongoClient("mongodb://");

// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = express.urlencoded({extended: false});


mongoClient.connect(function(err, client){

    if(err){
        return console.log(err);
    }
    // взаимодействие с базой данных
    const db = client.db("flat-control-dev");
    const collection = db.collection("Clients");
    collection.countDocuments(function(err, result){

        if(err){
            return console.log(err);
        }
    console.log(`Registry users count ${result} `);
    });

});

app.get('/api/auth/', (req, res) => {
    res.redirect(302, '/static/login.html?state='+req.query.state+'&redirect_uri='+req.query.redirect_uri+'&response_type='+req.query.response_type+'&client_id='+req.query.client_id);
});

app.post('/static/login.html', urlencodedParser,function (req, res) {
        if(!req.body) {
        return res.sendStatus(400);
    }
    mongoClient.connect(function(err, client) {

        if (err) {
            return console.log(err);
        }
        // взаимодействие с базой данных
        const db = client.db("flat-control-dev");
        const Client = db.collection("Clients");

        let userData = Client.findOne(req.body);
        if(userData.username = req.body.username)
        {
            let tmp_key = uuid.v4().toString();
            Client.findOneAndUpdate(req.body,{$set:{oauth:{lcode:tmp_key}}},function(err, result){
                console.log("random_key:"+ tmp_key);
                console.log({'Location': req.query.redirect_uri+encodeURI('?state='+req.query.state+'&code='+tmp_key+'&client_id='+process.env.clientkey)});
                res.redirect(302, req.query.redirect_uri+encodeURI('?state='+req.query.state+'&code='+tmp_key+'&client_id='+process.env.clientkey));
                res.end();
            });


        }
    });
    //res.end("Good bye");
});

app.post('/api/auth/', (req, res) =>{
    console.log(req);
    res.end("HHH");
});

app.post('/api/registry',  (req, res) =>{
    console.log(req);
    res.end("/api/registry")
});

app.get('/api/registry', (req, res) =>
{
    console.log(req);
    res.redirect(200, '/static/registry.html');
});

app.post('/api/token/', (req, res) => {
    console.log("/api/token - request");
    let tmp_key = uuid.v4().toString();
    console.log(JSON.stringify(req));
    console.log(JSON.stringify(req.headers));
    console.log(JSON.stringify(req.body));
    console.log(JSON.stringify(req.query));

    res.end(JSON.stringify({'access_token': tmp_key}));
});

app.get('/api/v1.0/',  (req, res) => {
    console.log(req);
    res.end('end point');
});

app.post('/api/v1.0/user/unlink/',  (req, res) => {
    console.log(req);
    res.end('account unlink');
});

app.get('/api/v1.0/user/devices/',  (req, res) => {
    console.log(req.body);
    res.end('get devices list user');
});

app.post('/api/v1.0/user/devices/query', (req, res) => {
    console.log(req);
    res.end('check state devices');
});

app.post('/api/v1.0/user/devices/action', (req, res) => {
    console.log(req);
    res.end('change state devices');
});


http.createServer(app).listen(PORT, err => {
    if(err) throw err;
    console.log("%c Server running", "color: green");
});