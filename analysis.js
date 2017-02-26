const ras = require("./rasbook");
const jstat = require("jstat").jStat;

function preprocess(timeVolumesByMsgID, normalize) {
  const nslots = timeVolumesByMsgID[0].length;
  
  var data = {};
  for (var i=0; i<timeVolumesByMsgID.length; i++) {
    var volume = timeVolumesByMsgID[i];
    var sum = volume.reduce(function(acc, val) {return acc + val;});
    if (sum != 0) {
      var msgID = ras.eventMap.val(i);
      if (normalize)
        for (var j=0; j<volume.length; j++) 
          volume[j] = volume[j] == 0 ? 0 : 1;
      data[msgID] = volume;
    }
  }

  return data;
}

function temporalMsgIdDistance(timeVolumesByMsgID) {
  const nslots = timeVolumesByMsgID[0].length;
  const data = preprocess(timeVolumesByMsgID, true);

  var results = [];
  for (var msgID in data) {
    var volume = data[msgID];
    for (var msgID1 in data) {
      if (msgID == msgID1) continue; 
      var volume1 = data[msgID1];
      var dist2 = 0;
      for (var i=0; i<nslots; i++) {
        dist2 += Math.pow(volume1[i] - volume[i], 2);
      }
      results.push(dist2);
    }
  }

  return {
    keys: Object.keys(data),
    dist2: results
  }
}

function temporalCorrelation(timeVolumesByMsgID) {
  const nslots = timeVolumesByMsgID[0].length;
  const data = preprocess(timeVolumesByMsgID, false);
  
  var results = {};
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
  temporalCorrelation: temporalCorrelation,
  temporalMsgIdDistance: temporalMsgIdDistance
};
