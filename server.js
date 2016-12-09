const express = require("express");
const http = require("http");
const cube = require("./cube").cube;

var mycube = new cube("raslog");

var app = express();
app.use(express.static("public"));

var server = http.createServer(app);
server.listen(8081);

app.get("/cube", function(req, res, next) {
  var results = mycube.query(JSON.parse("{}"));

  res.writeHead(200, {"context-type": "application/json"});
  res.end(JSON.stringify(results));
});
