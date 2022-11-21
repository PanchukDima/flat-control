const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
var uuid = require('uuid');
var ObjectId = require('mongodb').ObjectId;



const net = require('net');
const net_port = 9090;
const net_host = '0.0.0.0';


let sockets = [];

const MongoClient = require("mongodb").MongoClient;
const PORT = process.env.PORT || 3000;
const app = express();

console.log("process.env.clientkey: "+process.env.clientkey);

app.use(bodyParser.json());
app.use('/static', express.static('public'));
const mongoClient = new MongoClient(process.env.mongo_str);
//   const mongoClient = new MongoClient("mongodb://");

// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = express.urlencoded({extended: false});


const server = net.createServer();
server.listen(net_port, net_host, () => {
    console.log('TCP Server is running on port ' + net_port +'.');
});

server.on('connection', function(sock) {
    var mongo = require('mongodb')
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sock.on('data', function(data) {
        let row = data.toString().split(':');
        console.log('DATA ' + sock.remoteAddress + data);
        if(row[0] == 10)
        {

            mongoClient.connect(function(err, client) {

                if (err) {
                    return console.log(err);
                }
                // взаимодействие с базой данных
                const db = client.db("flat-control-dev");
                const Client = db.collection("Clients");
                console.log(row[1].toString())
                let str_find = {
                    "_id" : ObjectId(row[1].toString())
                }
                console.log(str_find);
                Client.find(str_find, {
                    projection:
                        {"_id":0}
                }).toArray(function (err, result) {
                    if (err) {
                        throw err
                    }
                    if (result[0].devices.length> 0) {
                        var device ={
                            id:row[1].toString(),
                            auth:true,
                            devices:row[2].toString().split(','),
                            net_sock:sock,
                            socket_control:{
                                live: true,
                                lasttime: null,
                                lastkey: null
                            }
                        };
                        sockets.push(device);
                        sock.write('99:0');
                    }
                    else
                    {
                        sock.write('99:1');
                    }
                });

            });

        }
// Write the data back to all the connected, the client will receive it as data from the server
    });
    sock.on('end', function() {
        let device = sockets.find(devices => devices.net_sock === sock);
        console.log(sockets);
        if(typeof(device) != 'undefined')
        {
            console.log(device.id+' Is disconnect');
            sockets.splice(sockets.indexOf(device), 1);
        }
        console.log(sockets);
    });
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
    //res.end("Good bye");
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
    //?state=https://social.yandex.ru/broker2/authz_in_web/0f03516f2dbe43428c3b2700e10f7253/callback&redirect_uri=https://social.yandex.net/broker/redirect&response_type=code&client_id=cfe4413eeb8f4a30ba5e7c7b9a777e04
    console.log(req.query['redirect_uri']/*+'?state='+req.query.state+'&code='+tmp_key+'&client_id='+process.env.clientkey*/);
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
                if (err) {
                    return console.log(err);
                }
                console.log(req.query)

                console.log(params.get('redirect_uri')+'?state='+params.get('https://flat-control.ru/static/login.html?state')+'&code='+tmp_key+'&client_id='+process.env.clientkey);
                res.redirect(params.get('redirect_uri')+'?state='+params.get('https://flat-control.ru/static/login.html?state')+'&code='+tmp_key+'&client_id='+process.env.clientkey);
                res.end();
            });


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
    mongoClient.connect(function(err, client) {

        if (err) {
            return console.log(err);
        }
        // взаимодействие с базой данных
        const db = client.db("flat-control-dev");
        const Client = db.collection("Clients");

        let tmp_key = uuid.v4().toString();
        Client.findOneAndUpdate({oauth:{lcode:req.body.code}},{$set:{oauth:{key:tmp_key}}},function(err, result){
            if (err) {
                return console.log(err);
            }
            console.log("random_key:"+ tmp_key);
            res.end(JSON.stringify({'access_token': tmp_key}));
        });


    });

});



app.head('/v1.0/',  (req, res) => {
    console.log(req);
    //res.sendStatus(200);
    res.end();
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
            payload:{ }
        };
        //var devices = Client.find({oauth:{key:TokenArray[1]}}).project({gateway:{devices:1}});
        Client.find({oauth:{key:TokenArray[1]}}, {
            projection:
                {"devices.port":0, "password":0, "_id":0, "oauth":0, "devices.capabilities.state":0}
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

app.post('/v1.0/user/devices/query', urlencodedParser, (req, res) => {
    mongoClient.connect(function(err, client) {
        if (err) {
            return console.log(err);
        }
        const db = client.db("flat-control-dev");
        const Client = db.collection("Clients");
        let authorization = req.headers.authorization;
        let TokenArray = authorization.split(" ");
        console.log(TokenArray[1]);
        let responseBody = {
            request_id: req.headers['x-request-id'],
            payload: {}
        };
        console.log('result: get Devices id: '+req.body.devices);
        let device_ids = req.body.devices.map(function (item) {
            return ObjectId(item.id);
        });
        Client.find({oauth: {key: TokenArray[1]}, "devices.id": {$in:device_ids} }, {
            projection:{
                "_id":0,
                "devices":{
                    $elemMatch: {
                        "id": {
                            $in: device_ids
                        }
                    }
                    },
                "devices.capabilities":1,
                "devices.id":1
            }

        }).toArray(function (err, result) {
            if (err) {
                throw err
            }

            responseBody.payload.devices = result[0].devices;
            console.log(JSON.stringify(responseBody));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseBody, null, 3));
            });
    });
});

app.post('/v1.0/user/devices/action', urlencodedParser, (req, res) => {
    console.log(JSON.stringify(req.body));
    mongoClient.connect(function(err, client) {
        if (err) {
            return console.log(err);
        }
        const db = client.db("flat-control-dev");
        const Client = db.collection("Clients");
        let authorization = req.headers.authorization;
        let TokenArray = authorization.split(" ");
        console.log(TokenArray[1]);
        let responseBody = {
            request_id: req.headers['x-request-id'],
            payload: {}
        };
        let devices = req.body.payload.devices;

        console.log(devices);

        Client.findOneAndUpdate(
            {
                oauth: {
                    key: TokenArray[1]
                },
                "devices.id": ObjectId(devices[0].id)
            },
            {
                $set: {
                    "devices.$.capabilities": devices[0].capabilities
                }
            }, function (err, result) {

                Client.find({
                    oauth: {
                        key: TokenArray[1]
                    },
                    "devices.id": ObjectId(devices[0].id)
                },
                    {
                        projection:{"devices":{$elemMatch:{"id":ObjectId(devices[0].id)}}, "_id":0, "devices.id":1}

            }).toArray(function (err, result) {
                    if (err) {
                        throw err
                    }
                    responseBody.payload.devices = result[0].devices;
                    responseBody.payload.devices[0].action_result = {"status":"DONE"};
                    sockets.forEach(device => {
                        if(device.devices.includes(req.body.payload.devices[0].id)) {
                            if (typeof (device) != 'undefined') {

                                device.net_sock.write("20:" + req.body.payload.devices[0].id + ":" + req.body.payload.devices[0].capabilities[0].state.value);
                            }
                        }
                        console.log(JSON.stringify(responseBody, null, 3));
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(responseBody, null, 3));
                    });
                });
            });

    });
});

http.createServer(app).listen(PORT, err => {
    if(err) throw err;
    console.log("%c Server running", "color: green");
});

