const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
var uuid = require('uuid');
const util = require('util');
var crypto = require('crypto');
const mqtt = require('mqtt');

const options = {
    host: process.env.host_mqtt,
    port: process.env.port_mqtt,
    protocol: 'mqtts',
    protocolVersion: 5,
    Username: process.env.username_mqtt,
    Password: process.env.password_mqtt,

};
const client_mqtt = mqtt.connect(options);
client_mqtt.publish('nodejs/messages/node7', 'Hello, HiveMQ!');

const Pool = require('pg').Pool
console.log(process.env.database_password);
console.log(process.env.database);

const pool = new Pool({
    host: 'localhost',
    user: 'node-express',
    database: process.env.database,
    password: process.env.database_password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});


const PORT = process.env.PORT || 3000;
const app = express(),
    session = require('express-session');

console.log("process.env.clientkey: "+process.env.clientkey);

const oneDay = 1000 * 60 * 60 * 24;

app.use(bodyParser.json());
app.use('/static', express.static('public'));
app.use(
    session({
        secret: '59bfa99b-e09f-4c85-bb35-261c39b6efc5',
        saveUninitialized: true,
        cookie: { maxAge: oneDay },
    })
)


// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = express.urlencoded({extended: false});


app.get('/api/', (req, res) =>{
    res.end('Hello');
});

app.get('/api/auth/', urlencodedParser, (req, res) => {
    console.log(req.query.request_uri);
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

        let query = req.query;
        let userData = Client.findOne(req.body);

        console.log(req.body);
        if(userData.username = req.body.username)
        {
            let tmp_key = uuid.v4().toString();
            Client.findOneAndUpdate(req.body,{$set:{oauth:{lcode:tmp_key}}},function(err, result){
                if(err){
                    return console.log(err);
                }
                console.log(req.query);
                console.log(query.redirect_uri+'?state='+req.query.state+'&code='+tmp_key+'&client_id='+process.env.clientkey);
                res.redirect(query.redirect_uri+'?state='+req.query.state+'&code='+tmp_key+'&client_id='+process.env.clientkey);
                res.end();
            });


        }
    });

});

app.post('/api/sendtoken/', urlencodedParser, function (req, res){
    if(!req.body) {
        return res.sendStatus(400);
    }

    console.log(req.headers.referer);
    console.log(req.body);
    var params = new URLSearchParams(req.headers.referer);
    console.log(params);
    console.log(params.get('https://flat-control.ru/static/login.html?state'));
    console.log(req.query['redirect_uri']);
    console.log(req.body.username);
    console.log(req.body.password);
    let tmp_key = uuid.v4().toString();
    let query = util.format("select public.sendtoken('%s', '%s', '%s') as result",req.body.username,req.body.password,tmp_key)
    console.log(query);
    pool.query(query, (err, dbres) =>{
        if(dbres.rows[0].result)
        {
            res.redirect(params.get('redirect_uri')+'?state='+params.get('https://flat-control.ru/static/login.html?state')+'&code='+tmp_key+'&client_id='+process.env.clientkey);
            res.end();
        }
    });

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
    let lcode = req.body.code;
    let tmp_key = uuid.v4().toString();
    let query = util.format('SELECT public.end_and_update_token(\'%s\',\'%s\') as result', lcode,tmp_key);
    console.log(query);
    pool.query(query, (err, dbres) =>{
        if (dbres.rows[0].result)
        {
            res.end(JSON.stringify({'access_token': tmp_key}));
        }
    });
});



app.head('/v1.0/',  (req, res) => {
    console.log('HEAR request /v1.0/');
    //res.sendStatus(200);
    res.end("OK");
});
app.get('/v1.0/',  (req, res) => {
    console.log('get request /v1.0/');
    //res.sendStatus(200);
    res.end("OK");
});
app.post('/v1.0/',  (req, res) => {
    console.log('POST request /v1.0/');
    //res.sendStatus(200);
    res.end("OK");
});
app.head('/api/v1.0/',  (req, res) => {
    console.log('HEAD request /api/v1.0/');
    //res.sendStatus(200);
    res.end("OK");
});
app.get('/api/v1.0/',  (req, res) => {
    console.log('get request /api/v1.0/');
    //res.sendStatus(200);
    res.end("OK");
});
app.post('/api/v1.0/',  (req, res) => {
    console.log('post request /api/v1.0/');
    //res.sendStatus(200);
    res.end("OK");
});

app.post('/v1.0/user/unlink',  (req, res) => {
    console.log(req);
    let authorization = req.headers.authorization;
    let TokenArray = authorization.split(" ");
    console.log(TokenArray[1]);
    let responseBody = {
        request_id: req.headers['x-request-id']
    };
    let query = util.format("SELECT public.\"unlink\"('%s') as result", TokenArray[1])
    console.log(query);
    pool.query(query , (err, dbres) =>
    {
        if(err)
        {
            console.log(err);
        }
        if(dbres.rows[0].result)
        {
            //res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseBody, null, 3));
        }
    })

    res.end('account unlink');
});

app.get('/v1.0/user/devices', urlencodedParser,(req, res) => {

    let authorization = req.headers.authorization;
    let TokenArray = authorization.split(" ");
    console.log(TokenArray[1]);
    let responseBody = {
        request_id: req.headers['x-request-id'],
        payload:{ }
    };
    let query = util.format("select public.devices_list('%s') as devices_client", TokenArray[1]);

    pool.query(query, (err, dbres) => {
        responseBody.payload = dbres.rows[0].devices_client;
        console.log(JSON.stringify(responseBody, null, 3));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(responseBody, null, 3));
    });
});

app.post('/v1.0/user/devices/query', urlencodedParser, (req, res) => {
    let authorization = req.headers.authorization;
    let TokenArray = authorization.split(" ");
    console.log(TokenArray[1]);
    let responseBody = {
        request_id: req.headers['x-request-id'],
        payload: {}
    };
    let device_ids = req.body.devices.map(function (item) {
        return item.id;
    });
    let query = util.format('select public.device_query(array%s,\'%s\') as devices' ,device_ids,TokenArray[1])
    console.log(query);
    pool.query(query, (err, dbres) =>
        {
            if (err) {
                return console.log(err);
            }
            responseBody.payload.devices = dbres.rows[0].devices;
            console.log(JSON.stringify(responseBody, null, 3));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseBody, null, 3));
        }
    );
});

app.post('/v1.0/user/devices/action', urlencodedParser, (req, res) => {
    console.log(JSON.stringify(req.body));
    let devices = req.body.payload.devices;
    let authorization = req.headers.authorization;
    let TokenArray = authorization.split(" ");
    let responseBody = {
        request_id: req.headers['x-request-id'],
        payload: {}
    };
        let query = util.format('SELECT json_agg(public.device_action(device, \'%s\')) from json_array_elements((\'%s\'::json)) device' , TokenArray[1],JSON.stringify(devices))
        console.log(query);
        pool.query(query, (err, dbres) =>
            {
                if (err) {
                    return console.log(err);
                }
                console.log(dbres.rows[0]);
                responseBody.payload.devices = dbres.rows[0].json_agg;
                console.log(responseBody);
                const postData = JSON.stringify(devices);
                client_mqtt.publish('nodejs/messages/node7', 'Hello, HiveMQ!');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(responseBody, null, 3));
            }
        );
});


//UI Block

app.post('/api/ui_login',urlencodedParser, (req, res) =>{
    console.log(req.body.name);
    req.session.username = req.body.name;
    let query = util.format('select password from client.credentials WHERE username = \'%s\'', req.body.name)
    let responseBody= {
        status : false
    };
    pool.query(query, (err, dbres) =>
        {
            if (err) {
                console.log(err);
                return res.sendStatus(404);
            }
            if(dbres.rows[0].password === req.body.password)
            {
                responseBody = {
                    status : true
                };

            }
            else
            {
                responseBody = {
                    status : false
                };
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseBody, null, 3));
        }
    );
});

app.post('/api/ui_getdevicelist' ,urlencodedParser, (req, res) =>{
    console.log(req);
    console.log(req.session.username);
    res.end('[0,name,status],[1,name,status]');
});

app.post('/api/flowdata', urlencodedParser, (req, res) =>{
    console.log(req.session.username);
    if(req.session.username == undefined)
    {
        res.redirect(302, '/static/login.html');
    }
    let query = 'select public.get_operators(\'asd\') as result'
    let responseBody;
    pool.query(query, (err, dbres) =>
        {
            if (err) {
                return console.log(err);
                return res.sendStatus(500);
            }
            responseBody = dbres.rows[0].result;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(dbres.rows[0].result, null, 3));
        }
    );
});

http.createServer(app).listen(PORT, err => {
    if(err) throw err;
    console.log("%c Server running", "color: green");
});

