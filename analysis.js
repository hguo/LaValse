const ras = require("./rasbook");
const jstat = require("jstat").jStat;
const DTW = require("dtw");

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
    array[i] = new Array(i+1);
    array[i].fill(0);
  }
  return array;
}

function temporalMsgIdDistance(data) {
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;

  var mat = createTriangularMatrix(n);
  for (var i=0; i<n; i++) {
    const volume = data[msgIDs[i]];
    for (var j=0; j<i; j++) {
      const volume1 = data[msgIDs[j]];
      
      var dist2 = 0;
      for (var k=0; k<volume.length; k++) {
        var diff = quantizedFreq(volume1[k]) - quantizedFreq(volume[k]);
        dist2 += diff * diff;
      }
      var dist = Math.sqrt(dist2);
      mat[i][j] = dist; 
    }
  }

  return mat;
}

function temporalMsgIdCorrelation(data) {
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;

  var mat = createTriangularMatrix(n);
  for (var i=0; i<n; i++) {
    const volume = data[msgIDs[i]];
    for (var j=0; j<i; j++) {
      const volume1 = data[msgIDs[j]];
     
      var coef = jstat.corrcoeff(volume, volume1);
      mat[i][j] = coef;
    }
  }

  return mat;
}

function temporalMsgIdDTW(data) {
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;

  var dtw = new DTW();
  var mat = createTriangularMatrix(n);
  for (var i=0; i<n; i++) {
    const volume = data[msgIDs[i]].map(function(d) {return d>0 ? 1 : 0;});
    for (var j=0; j<i; j++) {
      const volume1 = data[msgIDs[j]].map(function(d) {return d>0 ? 1: 0;});
      mat[i][j] = dtw.compute(volume, volume1);
      console.log(i, j, mat[i][j]);
    }
  }

  return mat;
}

module.exports = {
  temporalMsgIdDistance: temporalMsgIdDistance,
  temporalMsgIdCorrelation: temporalMsgIdCorrelation,
  temporalMsgIdDTW: temporalMsgIdDTW
};
