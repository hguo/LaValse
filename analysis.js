const ras = require("./rasbook");
const jstat = require("jstat").jStat;

function createMatrix(m, n) {
  var array = new Array(m);
  for (var i=0; i<m; i++) {
    array[i] = new Array(n);
    array[i].fill(0);
  }
  return array;
}

function createTriangularMatrix(n) {
  var array = new Array(n);
  for (var i=0; i<n; i++) {
    array[i] = new Array(n+1);
    array[i].fill(0);
  }
}

function temporalMsgIdDistance(data) { // msgIDVolumes.
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;

  var mat = createMatrix(n, n);
  for (var i=0; i<n; i++) {
    const volume = data[msgIDs[i]];
    for (var j=0; j<n; j++) {
      if (i == j) continue; 
      const volume1 = data[msgIDs[j]];
      
      var dist2 = 0;
      for (var k=0; k<volume.length; k++) {
        var diff = quantizedFreq(volume1[k]) - quantizedFreq(volume[k]);
        dist2 += diff * diff;
      }
      var dist = Math.sqrt(dist2);
      mat[i][j] = dist; 
      mat[j][i] = dist;
    }
  }

  return mat;
}

function temporalMsgIdCorrelation(data) {
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;

  var mat = createMatrix(n, n);
  for (var i=0; i<n; i++) {
    const volume = data[msgIDs[i]];
    for (var j=0; j<n; j++) {
      if (i == j) {
        mat[i][j] = 1; 
        continue; 
      }
      const volume1 = data[msgIDs[j]];
     
      var coef = jstat.corrcoeff(volume, volume1);
      mat[i][j] = coef;
    }
  }

  return mat;
}

module.exports = {
  temporalMsgIdDistance: temporalMsgIdDistance,
  temporalMsgIdCorrelation: temporalMsgIdCorrelation
};

