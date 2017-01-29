const fs = require("fs");
const csv = require("fast-csv");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
// const rasParser = require("./ras");
const rasbook = require("./rasbook");
const mira = require("./mira");

const url = "mongodb://localhost:27017/catalog";

function ras2cpp(d) { // convert ras log to the format that C++ can read
  var L = mira.parseLocation(d.location);
  var L0 = mira.locationToL0Location(L),
      L1 = mira.locationToL1Location(L), 
      L2 = mira.locationToL2Location(L), 
      L3 = mira.locationToL3Location(L), 
      L4 = mira.locationToL4Location(L);
  var L0i = rasbook.locationMaps[0].key(L0),
      L1i = rasbook.locationMaps[1].key(L1),
      L2i = rasbook.locationMaps[2].key(L2),
      L3i = rasbook.locationMaps[3].key(L3),
      L4i = rasbook.locationMaps[4].key(L4);
  var midplane = mira.locationToMidplane(L);

  console.log(d);
  // console.log(L0, L1, L2, L3, L4);
  console.log(
      d._id,
      d.eventTime.getTime(),
      rasbook.eventMap.key(d.messageID),
      rasbook.locationTypeMap.key(L.type), // locaitonType
      rasbook.midplaneMap.key(midplane),
      L0i, L1i, L2i, L3i, L4i);
}

var stream = fs.createReadStream(process.argv[2]);

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("connected.");

  var ras = db.collection("ras1"),
      backend = db.collection("backend"),
      cobalt = db.collection("cobalt");

  var csvStream = csv({headers: true})
    .on("data", function(d) {
      // rasParser.parse(d.MSG_ID, d.MESSAGE);
      var rasData = {
        _id: d.RECID,
        messageID: d.MSG_ID,
        component: d.COMPONENT,
        severity: d.SEVERITY,
        eventTime: new Date(d.EVENT_TIME + " GMT"),
        microsecond: +(d.EVENT_TIME.substr(d.EVENT_TIME.length - 3)),
        jobID: d.JOBID,
        partition: d.BLOCK,
        location: d.LOCATION,
        serialNumber: d.SERIALNUMBER,
        CPU: parseInt(d.CPU),
        count: parseInt(d.COUNT),
        controlActions: d.CTLACTION,
        message: d.MESSAGE,
        diagnosis: d.DIAGS,
        qualifier: d.QUALIFIER.replace(/\s+/g, '')
      };

      // console.log(rasData);

      backend.find({controlSystemTaskID: rasData.jobID})
        .toArray(function(err, docs) {
          var v = docs.length > 0;
          rasData.cobaltJobID = v ? docs[0].cobaltJobID : "";
          rasData.backendJobID = v ? docs[0]._id : "";
          rasData.backendUserName = v ? docs[0].userName : "";
          rasData.backendExitStatus = v ? docs[0].exitStatus : NaN;
          rasData.executable = v ? docs[0].executable : "";

          cobalt.find({_id: rasData.cobaltJobID})
            .toArray(function(err, docs) {
              assert.equal(null, err);

              var v = docs.length > 0;
              rasData.cobaltProjectName = v ? docs[0].cobaltProjectName : "";
              rasData.cobaltUserName = v ? docs[0].cobaltUserName : "";
              rasData.cobaltExitCode = v ? docs[0].exitCode : NaN;

              ras.insertOne(rasData);
              
              // console.log(rasData);
              // ras2cpp(rasData);
            });
        });
    })
    .on("end", function() {
      // db.close();
      console.log("finished.");
    });

  stream.pipe(csvStream);
});
