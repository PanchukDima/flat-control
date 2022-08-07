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

app.get('/api/auth/', async (req, res) => {
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
        const collection = db.collection("Clients");
        let userData = collection.findOne(req.body);
        if(userData.username = req.body.username)
        {
            let tmp_key = uuid.v4().toString();
            console.log("random_key:"+ tmp_key);
            /*params = {
                state: req.query.state,
                code: tmp_key,
                client_id: process.env.clientkey,
            };*/

            res.redirect(200,req.query.redirect_uri+encodeURI('?state='+req.query.state+'&code='+tmp_key+'&client_id'+process.env.clientkey));
        }
    });
    res.end("Good bye");
});

app.post('/api/auth/', async (req, res) =>{
    console.log(req);
    res.end("HHH");
});

app.post('/api/registry', async (req, res) =>{
    console.log(req);
    res.end("/api/registry")
});
app.get('/api/registry', async(req, res) =>
{
    res.redirect(200, '/static/registry.html');
});

app.post('/api/token/', async (req, res) => {
    console.log("/api/token - request");
    console.log(req);
    res.end(`token`);
});

app.get('/api/v1.0/', async (req, res) => {
    res.end('end point');
});

app.post('/api/v1.0/user/unlink/', async (req, res) => {
    res.end('account unlink');
});

app.get('/api/v1.0/user/devices/', async (req, res) => {
    res.end('get devices list user');
});

app.post('/api/v1.0/user/devices/query', async (req, res) => {
    res.end('check state devices');
});

app.post('/api/v1.0/user/devices/action', async (req, res) => {
    res.end('change state devices');
});


http.createServer(app).listen(PORT, err => {
    if(err) throw err;
    console.log("%c Server running", "color: green");
});