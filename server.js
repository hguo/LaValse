const WebSocketServer = require("ws").Server;
const express = require("express");
const http = require("http");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const msgpack = require("msgpack-lite");

const uri = "mongodb://localhost:27017/catalog";
const collectionName = "mira";

var app = express();
app.use(express.static("public"));

var server = http.createServer(app);
server.listen(8081);

var wss = new WebSocketServer({
  server: server, 
  path: "/ws"
});

wss.on("connection", function(ws) {
  ws.binaryType = "arraybuffer";
  console.log("connected.");

  ws.on("message", function(data) {
    // var msg = JSON.parse(data);
    var msg = msgpack.decode(data);
    console.log(msg);
    if (msg.type == "requestRASLog") {
      sendRASLog(ws, msg.query, msg.date0, msg.date1);
    } else if (msg.type == "requestRASHistogram") {
      sendRASHistogram(ws, msg.severity, msg.granularity, msg.date0, msg.date1);
    }
  });

  ws.on("close", function() {
    console.log("disconnected.");
  });
})

wss.on("close", function(ws) {
  console.log("closed.");
});


///// 
function sendRASLog(ws, query, date0, date1) {
  MongoClient.connect(uri, function(err, db) {
    if (err != null) return;

    query.eventTime = {"$gte": date0, "$lt":  date1};
    db.collection("mira")
      .aggregate([
        {"$match": query},
        {"$project": {
          // "id": "$_id",
          // "b": "$block",
          // "c": "$CPU",
          "t": "$eventTime",
          // "j": "$jobID",
          "l": "$location",
          // "m": "$message",
          "i": "$messageID"}}
      ])
      .toArray(function(err, docs) {
        assert.equal(err, null);
        
        var msg = {
          type: "RASLog",
          RASLog: docs
        };
        if (ws.readyState == 1) {
          ws.send(msgpack.encode(msg), {binary: true});
          // ws.send(JSON.stringify(msg));
          // ws.send(BSON.serialize(msg));
          console.log("sent ras log", docs.length);
        }
      });
  });
}

function sendHistogram(ws, query) {

}

function sendRASHistogram(ws, severity, granularity, date0, date1) {
  MongoClient.connect(uri, function(err, db) {
    if (err != null) return;
    db.collection("mira")
      .aggregate([
        {"$match": {"severity": severity, "eventTime": {$gte: new Date(date0), $lt: new Date(date1)} }},
        {"$project": {
          "y": {"$year": "$eventTime"},
          "m": {"$month": "$eventTime"},
          "d": {"$dayOfMonth": "$eventTime"},
          "messageID": 1, 
          "message": 1}},
        {"$group": {
          "_id": {"year": "$y", "month": "$m", "day": "$d", "hour": "$h"},
          "count": {"$sum": 1}}}
      ])
      .toArray(function(err, docs) {
        assert.equal(err, null);
        docs.forEach(function(d) {
          d.eventTime = new Date(d._id.year, d._id.month, d._id.day);
          delete d["_id"];
        });
        var msg = {
          type: "RASHistogram",
          severity: severity,
          granularit: granularity,
          date0: date0,
          date1: date1,
          RASHistogram: docs
        };
        if (ws.readyState == 1) {
          ws.send(JSON.stringify(msg));
          console.log("sent ras histogram", date0, date1);
        }
      });
  });
}
