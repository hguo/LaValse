const BiMap = require("bimap");
const csvLoader = require("csv-load-sync");

function constructBiMapFromCSV(filename, key) {
  var array = csvLoader(filename);
  var bimap = new BiMap;
  for (var i=0; i<array.length; i++)
    bimap.push(array[i][key], i);
  bimap.push("", array.length);
  return bimap;
}

var maintenanceTimeChecker = new function() {
  var array = csvLoader("maintenance.csv");
  array.forEach(function(d) {
    d.startTime = new Date(d.startTime);
    d.endTime = new Date(d.endTime);
  });

  this.check = function(t) {
    for (var i=0; i<array.length; i++) {
      if (t >= array[i].startTime && t >= array[i].endTime) return 1;
    }
    return 0;
  }
}

module.exports = {
  userMap: constructBiMapFromCSV("userProfiles.csv", "user"),
  projectMap: constructBiMapFromCSV("projProfiles.csv", "proj"),
  partitionMap: constructBiMapFromCSV("partitionInfo.csv", "partition"),
  checkMaintenanceTime: maintenanceTimeChecker.check
};

