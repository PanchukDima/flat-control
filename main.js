const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const MongoClient = require("mongodb").MongoClient;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use('/static', express.static('public'));

const mongoClient = new MongoClient(process.env.mongo_str);



mongoClient.connect(function(err, client){

    if(err){
        return console.log(err);
    }
    // взаимодействие с базой данных
    const db = client.db("flat-control_dev");
    const collection = db.collection("Clients");
    collection.countDocuments(function(err, result){

        if(err){
            return console.log(err);
        }
    console.log(`Registry users count ${result} `);
    });

});

app.get('/api/auth/', async (req, res) => {
    console.log(req.query);

    res.redirect(302, '/static/login.html?state='+req.query.state+'&redirect_uri='+req.query.redirect_uri+'&response_type='+req.query.response_type+'&client_id='+req.query.client_id);
});

app.post('/static/login.html' , async (req, res) =>{
    console.log(req.query);
    console.log(req);
    mongoClient.connect(function(err, client) {

        if (err) {
            return console.log(err);
        }
        // взаимодействие с базой данных
        const db = client.db("flat-control_dev");
        const collection = db.collection("Clients");
        console.log(collection.findOne("{username:"+req.params.username+"}"));
    });

    res.end("Good bye");
});

app.post('/api/auth/', async (req, res) =>{
    console.log(req.referer);
    res.end("HHH");
});

app.post('/api/registry', async(req, res) =>
{

});
app.get('/api/registry', async(req, res) =>
{
    res.redirect(200, '/static/registry.html');
});

app.get('/api/token/', async (req, res) => {
    res.end(`token`);
});

app.get('/api/v1.0/', async (req, res) => {
    res.end('end point');
});

app.post('/api/v1.0/user/unlink/', async (req, res) => {
    res.end('aaccount unlink');
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