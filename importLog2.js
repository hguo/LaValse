const fs = require("fs");
const csv = require("fast-csv");
const assert = require("assert");
const mira = require("./mira");
const rasbook = require("./rasbook");

var stream = fs.createReadStream(process.argv[2]);

var csvStream = csv({headers: true})
  .on("data", function(d) {
    // rasParser.parse(d.MSG_ID, d.MESSAGE);
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

    var L = mira.parseLocation(rasData.location);
    // var controlActionBits = rasbook.events[rasData.messageID].controlActionBits;
    var L0 = mira.locationToL0Location(L),
        L1 = mira.locationToL1Location(L), 
        L2 = mira.locationToL2Location(L), 
        L3 = mira.locationToL3Location(L), 
        L4 = mira.locationToL4Location(L);
    var L0i = rasbook.L0LocationMap.key(L0),
        L1i = rasbook.L1LocationMap.key(L1),
        L2i = rasbook.L2LocationMap.key(L2),
        L3i = rasbook.L3LocationMap.key(L3),
        L4i = rasbook.L4LocationMap.key(L4);
   
    // console.log(L0, L1, L2, L3, L4);
    console.log(
        rasData._id,
        rasbook.eventMap.key(rasData.messageID),
        rasData.eventTime.getTime(),
        // controlActionBits,
        rasbook.locationTypeMap.key(L.type), // locaitonType
        L0i, L1i, L2i, L3i, L4i);
  })
  .on("end", function() {
  });

stream.pipe(csvStream);
