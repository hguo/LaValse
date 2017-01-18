const express = require("express");
const http = require("http");
const cube = require("./cube").cube;
// const db = require("./db");
const deasync = require("deasync");
const basicAuth = require('basic-auth-connect');
const levelup = require("levelup");
const MongoClient = require("mongodb").MongoClient;

var mycube = new cube("raslog");
var rasdb = levelup("./db1");
var jobdb = levelup("./db2");

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

app.get("/db", function(req, res) {
  var query = JSON.parse(req.query.query); // query should be an array
  var results = {};
  var resultsArray = [];

  query.forEach(function(key) {
    rasdb.get(key, function(err, val) {
      results[key] = val;
      callback();
    });
  });

  var count = 0;
  function callback() {
    count ++;
    if (count == query.length) {
      query.forEach(function(key) {
        resultsArray.push(JSON.parse(results[key]));
      });
      res.end(JSON.stringify(resultsArray));
    }
  }
});

app.get("/cobalt", function(req, res) {
  var query = JSON.parse(req.query.query); // fields in query: T0, T1, minRunTimeSeconds
  const url = "mongodb://localhost:27017/catalog";

  MongoClient.connect(url, function(err, db) {
    db.collection("cobalt").find({
      "endTimestamp": {$gte: new Date(query.T0)}, 
      "startTimestamp": {$lte: new Date(query.T1)},
      "runTimeSeconds": {$gte: query.minRunTimeSeconds}
    }).toArray(function(err, docs) {
      res.end(JSON.stringify(docs));
    });
  });
});
