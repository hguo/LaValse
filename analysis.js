const ras = require("./rasbook");
const jstat = require("jstat").jStat;

function createArray2D(m, n) {
  var array = new Array(m);
  for (var i=0; i<m; i++) {
    array[i] = new Array(n);
    array[i].fill(0);
  }
  return array;
}

function preprocess(timeVolumesByMsgID, normalize) { // remove volumes that are all zero; convert arrays to key-value pairs
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
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;
 
  var mat = createArray2D(n, n);
  for (var i=0; i<n; i++) {
    const volume = data[msgIDs[i]];
    for (var j=0; j<n; j++) {
      if (i == j) continue; 
      const volume1 = data[msgIDs[j]];
      
      var dist2 = 0;
      for (var i=0; i<nslots; i++) {
        dist2 += Math.pow(volume1[i] - volume[i], 2);
      }
      results[i][j] = dist2;
      results[j][i] = dist2;
    }
  }

  return dist2;
}

function pearsonCorrelation(volumes) {
  const nslots = volumes[0].length;
  const data = preprocess(timeVolumesByMsgID, false);

  var keys = Object.keys(data);
  var mat = [];

  for (var i=0; i<keys.length; i++) {

  }

  for (var msgID in data) {
    var volume = data[msgID];
    for (var msgID1 in data) {
      if (msgID == msgID1) continue; 
      var volume1 = data[msgID1];
      var coef = jstat.corrcoeff(volume, volume1);
    }
  }
  
  var results = {
  };
}

module.exports = {
  temporalCorrelation: temporalCorrelation,
  temporalMsgIdDistance: temporalMsgIdDistance
};
