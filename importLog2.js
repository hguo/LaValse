const fs = require("fs");
const levelup = require("levelup");
const csv = require("fast-csv");
const assert = require("assert");
const mira = require("./mira");
const rasbook = require("./rasbook");

var db = levelup("./db1");

var stream = fs.createReadStream(process.argv[2]);

var csvStream = csv({headers: true})
  .on("data", function(d) {
    // rasParser.parse(d.MSG_ID, d.MESSAGE);
    var rasData = {
      id: d.RECID,
      msgID: d.MSG_ID,
      // component: d.COMPONENT,
      // severity: d.SEVERITY,
      eventTime: new Date(d.EVENT_TIME + " GMT"),
      jobID: d.JOBID,
      block: d.BLOCK,
      location: d.LOCATION,
      // serialNumber: d.SERIALNUMBER,
      CPU: parseInt(d.CPU),
      count: parseInt(d.COUNT),
      // controlActions: d.CTLACTION.split(","),
      message: d.MESSAGE,
      // diagnosis: d.DIAGS,
      // qualifier: d.QUALIFIER,
      // machineName: d.MACHINE_NAME
    };

    db.put(rasData.id, JSON.stringify(rasData));

    /*
    var L = mira.parseLocation(rasData.location);
    // var controlActionBits = rasbook.events[rasData.messageID].controlActionBits;
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
   
    // console.log(L0, L1, L2, L3, L4);
    console.log(
        rasData._id,
        rasbook.eventMap.key(rasData.messageID),
        rasData.eventTime.getTime(),
        // controlActionBits,
        rasbook.locationTypeMap.key(L.type), // locaitonType
        L0i, L1i, L2i, L3i, L4i);
    */
  })
  .on("end", function() {
  });

stream.pipe(csvStream);
