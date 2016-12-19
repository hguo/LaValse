const express = require("express");
const http = require("http");
const cube = require("./cube").cube;
// const db = require("./db");
const deasync = require("deasync");
const basicAuth = require('basic-auth-connect');
const levelup = require("levelup");

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
  var results = [];

  query.forEach(function(d) {
    results.push(JSON.parse(getSync(rasdb, d)));
  });

  res.end(JSON.stringify(results));

  function getSync(db, key) {
    var done = false;
    var data;
    db.get(key, function(err, val) {
      data = val;
      done = true;
    });
    deasync.loopWhile(function() {return !done;});
    return data;
  }
});

app.get("/job", function(req, res) {
  var query = JSON.parse(req.query.query);
  res.end();
});
