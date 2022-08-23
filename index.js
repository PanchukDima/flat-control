const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
var uuid = require('uuid');

const net = require('net');
const net_port = 7070;
const net_host = '0.0.0.0';


const MongoClient = require("mongodb").MongoClient;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use('/static', express.static('public'));
const mongoClient = new MongoClient(process.env.mongo_str);
//   const mongoClient = new MongoClient("mongodb://");

// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = express.urlencoded({extended: false});


const server = net.createServer();
server.listen(net_port, net_host, () => {
    console.log('TCP Server is running on port ' + port +'.');
});

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

app.get('/', (req, res) =>{
    res.end('Hello');
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
                console.log(req.query.redirect_uri+'?state='+req.query.state+'&code='+tmp_key+'&client_id='+process.env.clientkey);
                res.redirect(req.query.redirect_uri+'?state='+req.query.state+'&code='+tmp_key+'&client_id='+process.env.clientkey);
                res.end();
            });


        }
    });
    //res.end("Good bye");
});

app.post('/api/auth/', (req, res) =>{
    console.log(req);
    res.end("HHH1");
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

app.post('/api/token/',urlencodedParser, (req, res) => {
    if(!req.body) {
        return res.sendStatus(400);
    }
    console.log("/api/token - request");
    mongoClient.connect(function(err, client) {

        if (err) {
            return console.log(err);
        }
        // взаимодействие с базой данных
        const db = client.db("flat-control-dev");
        const Client = db.collection("Clients");

        let tmp_key = uuid.v4().toString();
        Client.findOneAndUpdate({oauth:{lcode:req.body.code}},{$set:{oauth:{key:tmp_key}}},function(err, result){
            console.log("random_key:"+ tmp_key);
            res.end(JSON.stringify({'access_token': tmp_key}));
        });


    });

});

app.get('/v1.0/',  (req, res) => {
    console.log(req);
    res.end('end point');
});

app.post('/v1.0/user/unlink',  (req, res) => {
    console.log(req);
    res.end('account unlink');
});

app.get('/v1.0/user/devices', urlencodedParser,(req, res) => {
    mongoClient.connect(function(err, client) {
        if (err) {
            return console.log(err);
        }
        // взаимодействие с базой данных
        const db = client.db("flat-control-dev");
        const Client = db.collection("Clients");
        let authorization = req.headers.authorization;
        let TokenArray = authorization.split(" ");
        console.log(TokenArray[1]);
        let responseBody = {
            request_id: req.headers['x-request-id'],
            payload:{

            }
        };
        //var devices = Client.find({oauth:{key:TokenArray[1]}}).project({gateway:{devices:1}});
        Client.find({oauth:{key:TokenArray[1]}}, {
            projection:
                {"devices.ports":0, "password":0, "_id":0, "oauth":0}
        }).toArray(function (err, result) {
            if (err) {
                throw err
            }
            console.log(result);
            responseBody.payload.user_id = result[0].username;
            responseBody.payload.devices = result[0].devices;
            console.log(JSON.stringify(responseBody));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseBody, null, 3));
        });

    });
});

app.post('/v1.0/user/devices/query', (req, res) => {
    console.log(req);
    res.end('check state devices');
});

app.post('/v1.0/user/devices/action', (req, res) => {
    console.log(req);
    res.end('change state devices');
});

app.get('/stream', function (req, res, next) {
    //when using text/plain it did not stream
    //without charset=utf-8, it only worked in Chrome, not Firefox
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    res.write("Thinking...");
    sendAndSleep(res, 1);
});

var sendAndSleep = function (response, counter) {
    if (counter > 100) {
        response.end();
    } else {
        response.write(" ;i=" + counter);
        counter++;
        setTimeout(function () {
            sendAndSleep(response, counter);
        }, 1000)
    };
};

app.post('/sub', function (req, res, next) {
    //when using text/plain it did not stream
    //without charset=utf-8, it only worked in Chrome, not Firefox
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    console.log(req.body);
    res.write("Thinking...");
    subscribe(res, req.body.id);
});

var subscribe = function (response, device_id) {
    mongoClient.connect(function(err, client) {
        if (err) {
            return console.log(err);
        }
        var mongo = require('mongodb');
        const db = client.db("flat-control-dev");
        const Client = db.collection("Clients");

        Client.find({oauth: {key: "01724a4b-8f25-44f1-ae8b-e80de259e974"}, "devices.id": new mongo.ObjectId("62f0dbe4d78d0518dcd873fe")}, {
            projection:
                {"devices.ports": 1}
        }).toArray(function (err, result) {
            if (err) {
                throw err
            }
            console.log(result);

            response.write(JSON.stringify(result));
            setTimeout(function () {
                subscribe(response, device_id);
            }, 1000);

        });
    });

};

http.createServer(app).listen(PORT, err => {
    if(err) throw err;
    console.log("%c Server running", "color: green");
});

