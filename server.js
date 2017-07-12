const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const cube = require("./cube").cube;
const basicAuth = require('basic-auth-connect');
const MongoClient = require("mongodb").MongoClient;

const uri = "mongodb://localhost:27017/catalog1";

var mycube = new cube("raslog");

var app = express();
// app.use(basicAuth("catalog", "catalog1"));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static("public"));

var server = http.createServer(app);
server.listen(8081);

app.post("/cube_post", function(req, res) {
  var query = req.body;
  var results = mycube.query(query);

  res.writeHead(200, {"context-type": "application/json"});
  res.end(JSON.stringify(results));
});

app.get("/cube", function(req, res, next) {
  var query = JSON.parse(req.query.query);
  var results = mycube.query(query);

  res.writeHead(200, {"context-type": "application/json"});
  res.end(JSON.stringify(results));
});
  
MongoClient.connect(uri, function(err, db) {
  if (err != null) console.log(err);
  
  app.get("/cobalt", function(req, res) {
    const limit = 500; // return no more than this number of jobs
    var query = JSON.parse(req.query.query); // fields in query: T0, T1
    db.collection("cobalt").aggregate([
        {"$match": {"endTime": {$gte: new Date(query.T0)}, "startTime": {$lte: new Date(query.T1)}}},
        {"$sort": {"runTimeSeconds": -1}},
        {"$limit": limit}
    ]).toArray(function(err, docs) {
      res.end(JSON.stringify(docs));
    });
  });

  /* 
  app.get("/cobalt", function(req, res) {
    var query = JSON.parse(req.query.query); // fields in query: T0, T1, minRunTimeSeconds
    db.collection("cobalt").find({
      "endTime": {$gte: new Date(query.T0)}, 
      "startTime": {$lte: new Date(query.T1)},
      "runTimeSeconds": {$gte: query.minRunTimeSeconds}
    }).toArray(function(err, docs) {
      res.end(JSON.stringify(docs));
    });
  }); */

  app.get("/backendJobsByCobaltJobID", function(req, res) {
    const limit = 3000;
    var query = JSON.parse(req.query.query); 
    db.collection("backend").aggregate([
        {"$match": {"cobaltJobID": {"$in": query}}}, 
        // {"$sort": {"runTimeSeconds": -1}} // TODO: add runTimeSeconds property for backend jobs
        {"$limit": limit}
    ])
    .toArray(function(err, docs) {
      res.end(JSON.stringify(docs));
    });
  });

  app.get("/ras", function(req, res) {
    var query = JSON.parse(req.query.query); // query should be an array
    var set = [];
    query.forEach(function(d) {set.push(d.toString());});

    db.collection("ras").find({
      _id: {$in: set}
    }).toArray(function(err, docs) {
      res.end(JSON.stringify(docs));
    });
  });
});
