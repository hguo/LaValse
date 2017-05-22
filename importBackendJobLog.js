const fs = require("fs");
const csv = require("fast-csv");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const url = "mongodb://localhost:27017/catalog1";

var stream = fs.createReadStream(process.argv[2]);

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("connected.");

  var collection = db.collection("backend");

  var csvStream = csv({headers: true})
    .on("data", function(d) {
      var data = {
        _id: d.ID,
        cobaltJobID: d.COBALT_JOBID,
        controlSystemTaskID: d.CONTROLSYSTEM_TASKID,
        userName: +d.TASK_USER_GENID,
        machinePartition: d.LOCATION,
        executable: +d.EXECUTABLE_GENID,
        startTime: new Date(d.TIME_START + " GMT"),
        endTime: new Date(d.TIME_END + " GMT"),
        exitStatus: +d.EXITSTATUS,
        errText: d.ERRTEXT,
        shapeA: +d.SHAPEA,
        shapeB: +d.SHAPEB,
        shapeC: +d.SHAPEC,
        shapeD: +d.SHAPED,
        shapeE: +d.SHAPEE,
        corner: d.CORNER.replace(" ", ""),
        isSubblock: +d.IS_SUBBLOCK,
        isConsecutive: +d.IS_CONSECUTIVE,
        isMultilocation: +d.IS_MULTILOCATION,
        isSingle: +d.IS_SINGLE
      };
      collection.insertOne(data);
    })
    .on("end", function() {
      db.close();
      console.log("finished.");
    });

  stream.pipe(csvStream);
});
