const express = require("express");
const http = require("http");
const cube = require("./cube").cube;
const basicAuth = require('basic-auth-connect');
const MongoClient = require("mongodb").MongoClient;

const uri = "mongodb://localhost:27017/catalog";

var mycube = new cube("raslog");

var app = express();
app.use(express.static("public"));
// app.use(basicAuth("catalog", "catalog1"));

var server = http.createServer(app);
server.listen(8081);

app.get("/cube", function(req, res, next) {
  var query = JSON.parse(req.query.query);
  var results = mycube.query(query);

  res.writeHead(200, {"context-type": "application/json"});
  res.end(JSON.stringify(results));
});
  
MongoClient.connect(uri, function(err, db) {
  if (err != null) console.log(err);

  app.get("/cobalt", function(req, res) {
    var query = JSON.parse(req.query.query); // fields in query: T0, T1, minRunTimeSeconds
    db.collection("cobalt").find({
      "endTimestamp": {$gte: new Date(query.T0)}, 
      "startTimestamp": {$lte: new Date(query.T1)},
      "runTimeSeconds": {$gte: query.minRunTimeSeconds}
    }).toArray(function(err, docs) {
      res.end(JSON.stringify(docs));
    });
  });

  app.get("/backend", function(req, res) {
    var query = JSON.parse(req.query.query); 
    var dbquery = {};
    if ("cobaltJobID" in query) 
      dbquery["cobaltJobID"] = query.cobaltJobID;
    else if ("backendJobID" in query)
      dbquery["_id"] = query.backendJobID;

    db.collection("backend").find(dbquery)
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
