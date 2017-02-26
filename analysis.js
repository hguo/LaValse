const ras = require("./rasbook");
const jstat = require("jstat").jStat;


function temporalCorrelation(timeVolumesByMsgID) {
  console.log(timeVolumesByMsgID.length);
  var data = timeVolumesByMsgID.filter(function(d) {
    console.log(jstat.covariance(d, d));
    var sum = d.reduce(function(acc, val) {return acc + val;});
    return sum != 0;
  });
}

module.exports = {
  temporalCorrelation: temporalCorrelation
};
