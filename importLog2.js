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
    var a = mira.locationToFixedSizeArray(rasData.location);
    var RMN = mira.locationToRMNLocation(rasData.location);
    var RMNindex = rasbook.RMNLocationMap.key(RMN);
    if (RMNindex == undefined) RMNindex = 0;

    console.log(
        rasData._id,
        rasbook.eventMap.key(rasData.messageID),
        rasData.eventTime.getTime(),
        a[0], // location type
        RMNindex);
  })
  .on("end", function() {
  });

stream.pipe(csvStream);
