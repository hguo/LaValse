const fs = require("fs");
const csv = require("fast-csv");
const assert = require("assert");
const mira = require("./mira");

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
    var a = mira.locationToFixedSizeArray(rasData.location);

    console.log(
        rasData._id,
        parseInt("0x" + rasData.messageID.toLowerCase(), 16), 
        rasData.eventTime.getTime(),
        a[0], a[1], a[2], a[3], a[4], a[5]);
  })
  .on("end", function() {
  });

stream.pipe(csvStream);
