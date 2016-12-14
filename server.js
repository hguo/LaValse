const express = require("express");
const http = require("http");
const cube = require("./cube").cube;
const db = require("./db");
const basicAuth = require('basic-auth-connect');

var mycube = new cube("raslog");

var app = express();
app.use(express.static("public"));
app.use(basicAuth("catalog", "catalog1"));

var server = http.createServer(app);
server.listen(8081);

app.get("/cube", function(req, res, next) {
  var query = JSON.parse(req.query.query);
  var results = mycube.query(query);

  res.writeHead(200, {"context-type": "application/json"});
  res.end(JSON.stringify(results));
});

app.get("/db", function(req, res) {
  var query = JSON.parse(req.query.query);
  var results = db.query(query);

  res.writeHead(200, {"context-type": "application/json"});
  res.end(JSON.stringify(results));
});
