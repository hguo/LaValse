const WebSocketServer = require("ws").Server;
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const uri = "mongodb://localhost:27017/catalog";
const collectionName = "mira";

var wss = new WebSocketServer({
  port : 8082, 
  perMessageDeflate : "false"
});

wss.on("connection", function(ws) {
  console.log("connected.");

  ws.on("message", function(data) {
    var msg = JSON.parse(data);
    console.log(msg);
    if (msg.type == "requestRASLog") {
      sendRASLog(ws, msg.severity, msg.date0, msg.date1);
    } else if (msg.type == "requestFrame") {
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
function sendRASLog(ws, severity, date0, date1) {
  MongoClient.connect(uri, function(err, db) {
    if (err != null) return;
    db.collection("mira")
      .find({
        severity: severity,
        eventTime: {$gte: new Date(date0), $lt: new Date(date1)}, 
      })
      .toArray(function(err, docs) {
        assert.equal(err, null);
        
        var msg = {
          type: "RASLog",
          severity: severity, 
          date0: date0,
          date1: date1,
          RASLog: docs
        };
        if (ws.readyState == 1) {
          ws.send(JSON.stringify(msg));
          console.log("sent ras log", date0, date1);
        }
      });
  });
}
