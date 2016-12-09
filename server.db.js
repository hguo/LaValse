const WebSocketServer = require("ws").Server;
const express = require("express");
const http = require("http");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const msgpack = require("msgpack-lite");

const uri = "mongodb://localhost:27017/catalog";
const collectionName = "mira";

loadRASLog(new Date("2015-01-01"), new Date("2015-01-05"));

var app = express();
app.use(express.static("public"));

var server = http.createServer(app);
server.listen(8081);

///// 
function loadRASLog(date0, date1) {
  var query = {};
  MongoClient.connect(uri, function(err, db) {
    if (err != null) return;

    query.eventTime = {"$gte": date0, "$lt":  date1};
    db.collection("mira")
      .aggregate([
        {"$match": query},
        {"$project": {
          "id": "$_id",
          "b": "$block",
          "c": "$CPU",
          "t": "$eventTime",
          "j": "$jobID",
          "l": "$location",
          "m": "$message",
          "i": "$messageID"}}
      ])
      .toArray(function(err, docs) {
        assert.equal(err, null);
        
        app.get("/refresh", function(req, res, next) {
          var results = {};
          res.writeHead(200, {"context-type": "application/json"});
          res.end((JSON.stringify(docs)));
        });

        console.log(docs.length);
      });
  });
}
