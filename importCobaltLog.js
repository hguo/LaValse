const fs = require("fs");
const csv = require("fast-csv");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const url = "mongodb://localhost:27017/catalog";

var stream = fs.createReadStream(process.argv[2]);

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("connected.");

  var collection = db.collection("cobalt");

  var csvStream = csv({headers: true})
    .on("data", function(d) {
      var data = {
        _id: d.JOBID,
        queuedTimestamp: new Date(d.QUEUED_TIMESTAMP + " GMT"),
        startTimestamp: new Date(d.START_TIMESTAMP + " GMT"),
        endTimestamp: new Date(d.END_TIMESTAMP + " GMT"),
        runTimeSeconds: +d.RUNTIME_SECONDS,
        wallTimeSeconds: +d.WALLTIME_SECONDS,
        requestedCores: +d.REQUESTED_CORES,
        usedCores: +d.USED_CORES,
        requestedNodes: +d.REQUESTED_NODES,
        usedNodes: +d.USED_NODES,
        requestedCoreHours: +d.REQUESTED_CORE_HOURS,
        requestedCoreSeconds: +d.REQUESTED_CORE_SECONDS,
        usedCoreHours: +d.USED_CORE_HOURS,
        usedCoreSeconds: +d.USED_CORE_SECONDS,
        cobaltProjectName: d.COBALT_PROJECT_NAME_GENID,
        cobaltUserName: d.COBALT_USER_NAME_GENID,
        machinePartition: d.MACHINE_PARTITION,
        exitCode: +d.EXIT_CODE,
        queue: +d.QUEUE_GENID,
        mode: d.MODE,
        resID: +d.RESID,
        deletedBy: d.DELETED_BY_GENID,
        projectName: d.PROJECT_NAME_GENID
      };
      // console.log(data);
      collection.insertOne(data);
    })
    .on("end", function() {
      db.close();
      console.log("finished.");
    });

  stream.pipe(csvStream);
});
