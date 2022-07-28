const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const MongoClient = require("mongodb").MongoClient;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

const mongoClient = new MongoClient(ENV['mongo_str']);
console.log(process.env.mongo_str);
mongoClient.connect(function(err, client){

    if(err){
        return console.log(err);
    }
    // взаимодействие с базой данных
    client.close();
});

app.get('/api/auth/', async (req, res) => {
    res.end(`Hello UserName`);
});
app.get('/api/token/', async (req, res) => {
    res.end(`Hello UserName`);
});
http.createServer(app).listen(PORT, err => {
    if(err) throw err;
    console.log("%c Server running", "color: green");
});