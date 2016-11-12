const fs = require("fs");
const csv = require("fast-csv");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const rasParser = require("./ras");

const url = "mongodb://localhost:27017/catalog";

var stream = fs.createReadStream(process.argv[2]);

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("connected.");

  var collection = db.collection("mira");

  var csvStream = csv({headers: true})
    .on("data", function(ras) {
      writeRASLog(collection, ras);
    })
    .on("end", function() {
      db.close();
      console.log("finished.");
    });

  stream.pipe(csvStream);

  function writeRASLog(collection, data) {
    var messageID = data.MSG_ID;
    var details = new rasParser.parse(data.MSG_ID, data.MESSAGE);
    console.log(details);
    // collection.insertOne(ras);
  }
});
