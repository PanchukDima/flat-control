const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

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