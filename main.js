const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const port = process.argv.slice(2)[0];
const app = express();

app.use(bodyParser.json());

app.get('/', async (req, res) => {
    res.end(`Hello UserName`);
});
app.get('/hello', async (req, res) => {
    res.end(`Hello UserName`);
});
http.createServer(app).listen(80);