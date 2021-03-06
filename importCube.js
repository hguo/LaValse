const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const async = require("async");
const mira = require("./mira");
const rasbook = require("./rasbook");
const profiles = require("./profiles");

var uri = "mongodb://localhost:27017/catalog1";

MongoClient.connect(uri, function(err, db) {
  var q = async.queue(function(doc, cb) {
    printRAS(doc);
    cb();
  });
  
  var cursor = db.collection("ras").find({
  }); // {severity: "FATAL"});
  cursor.forEach(function(doc) {
    q.push(doc);
  });

  q.drain = function() {
    if (cursor.isClosed()) {
      db.close();
    }
  }
});

function sanityCheck(array) {

}

function printRAS(ras) {
  if (ras.messageID == "00050000" || ras.messageID == "00000000") return; // dummy message
  
  var L = mira.parseLocation(ras.location.replace(/\s/g,''));
  var L0 = mira.locationToL0Location(L),
      L1 = mira.locationToL1Location(L), 
      L2 = mira.locationToL2Location(L), 
      L3 = mira.locationToL3Location(L);
  var L0i = rasbook.locationMaps[0].key(L0),
      L1i = rasbook.locationMaps[1].key(L1),
      L2i = rasbook.locationMaps[2].key(L2),
      L3i = rasbook.locationMaps[3].key(L3);
  var midplane = mira.locationToMidplane(L);

  // console.log(L0, L1, L2, L3, L4);
  console.log(
      ras._id,
      rasbook.eventMap.key(ras.messageID),
      ras.eventTime.getTime(),
      +ras.cobaltJobID,
      profiles.checkMaintenanceTime(ras.eventTime),
      profiles.userMap.key(ras.userName),
      profiles.projectMap.key(ras.projectName),
      // profiles.partitionMap.key(ras.partition),
      rasbook.midplaneMap.key(midplane),
      rasbook.locationTypeMap.key(L.type), // locaitonType
      L0i, L1i, L2i, L3i);
}
