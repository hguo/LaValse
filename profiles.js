const BiMap = require("bimap");
const csvLoader = require("csv-load-sync");

function constructBiMapFromCSV(filename, key) {
  var array = csvLoader(filename);
  var bimap = new BiMap;
  for (var i=0; i<array.length; i++)
    bimap.push(array[i][key], i);
  return bimap;
}

module.exports = {
  userMap: constructBiMapFromCSV("userProfiles.csv", "user"),
  projectMap: constructBiMapFromCSV("projProfiles.csv", "proj")
};

