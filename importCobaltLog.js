const fs = require("fs");
const csv = require("fast-csv");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const randomColor = require("randomcolor");

const url = "mongodb://localhost:27017/catalog1";

var stream = fs.createReadStream(process.argv[2]);

var count = 0;

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("connected.");

  var backend = db.collection("backend"),
      cobalt = db.collection("cobalt");

  var csvStream = csv({headers: true})
    .on("data", function(d) {
      var cobaltJob = {
        _id: d.COBALT_JOBID,
        // allocationType: +d.ALLOCATION_TYPE,
        queuedTimestamp: new Date(d.QUEUED_TIMESTAMP + " GMT"),
        startTimestamp: new Date(d.START_TIMESTAMP + " GMT"),
        endTimestamp: new Date(d.END_TIMESTAMP + " GMT"),
        userName: +d.USERNAME_GENID,
        projectName: +d.PROJECT_NAME_GENID,
        queue: d.QUEUE_NAME,
        wallTimeSeconds: +d.WALLTIME_SECONDS,
        runTimeSeconds: +d.RUNTIME_SECONDS,
        nodesUsed: +d.NODES_USED,
        coresUsed: +d.CORES_USED,
        partition: d.MACHINE_PARTITION,
        exitStatus: +d.EXIT_STATUS,
        mode: d.MODE
      };
          
      cobalt.insertOne(cobaltJob);

      /*
      backend.find({cobaltJobID: cobaltJob._id})
        .toArray(function(err, docs) {
          assert.equal(null, err);
          cobaltJob.backendJobs = docs;
          
          // console.log(cobaltJob);
          cobalt.insertOne(cobaltJob);
        });
      */
    })
    .on("end", function() {
      db.close();
      console.log("finished.");
    });

  stream.pipe(csvStream);
});
