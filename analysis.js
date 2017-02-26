const ras = require("./rasbook");
const jstat = require("jstat").jStat;

function temporalCorrelation(timeVolumesByMsgID) {
  var data = {};
  var results = {};

  for (var i=0; i<timeVolumesByMsgID.length; i++) {
    var volume = timeVolumesByMsgID[i];
    var sum = volume.reduce(function(acc, val) {return acc + val;});
    if (sum != 0) {
      var msgID = ras.eventMap.val(i);
      
      // for (var j=0; j<volume.length; j++) {
        // volume[j] = volume[j] == 0 ? 0 : 1;
      // }
      data[msgID] = volume;
    }
  }
  
  for (var msgID in data) {
    var volume = data[msgID];
    for (var msgID1 in data) {
      if (msgID == msgID1) continue; 
      var volume1 = data[msgID1];
      var coef = jstat.corrcoeff(volume, volume1);
      if (coef > 0.8) {
        console.log(msgID, msgID1, jstat.corrcoeff(volume, volume1));
      }
    }
  }
}

module.exports = {
  temporalCorrelation: temporalCorrelation
};
