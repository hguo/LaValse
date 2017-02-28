function createArray2D(m, n) {
  var array = new Array(m);
  for (var i=0; i<m; i++) {
    array[i] = new Array(n);
    array[i].fill(0);
  }
  return array;
}

function temporalMsgIdDistance(data) {
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;

  var mat = createArray2D(n, n);
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
      mat[i][j] = dist2;
      mat[j][i] = dist2;
    }
  }

  return mat;
}

function temporalMsgIdCorrelation(data) {
  const msgIDs = Object.keys(data);
  const n = msgIDs.length;

  var jstat = this.jStat;

  var mat = createArray2D(n, n);
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
      mat[j][i] = coef;
    }
  }

  return mat;
}
