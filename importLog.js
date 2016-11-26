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
    .on("data", function(d) {
      rasParser.parse(d.MSG_ID, d.MESSAGE);
      var rasData = {
        _id: d.RECID,
        messageID: d.MSG_ID,
        component: d.COMPONENT,
        severity: d.SEVERITY,
        eventTime: new Date(d.EVENT_TIME + " GMT"),
        jobID: d.JOBID,
        block: d.BLOCK,
        location: d.LOCATION,
        serialNumber: d.SERIALNUMBER,
        CPU: parseInt(d.CPU),
        count: parseInt(d.COUNT),
        controlActions: d.CTLACTION.split(","),
        message: d.MESSAGE,
        diagnosis: d.DIAGS,
        qualifier: d.QUALIFIER,
        machineName: d.MACHINE_NAME
      };
      // collection.insertOne(rasData);
    })
    .on("end", function() {
      db.close();
      console.log("finished.");
    });

  stream.pipe(csvStream);
});
