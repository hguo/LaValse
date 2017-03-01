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
  const n = data.length;

  var mat = createTriangularMatrix(n);
  for (var i=0; i<n; i++) {
    const volume = data[i].volumes;
    for (var j=0; j<i; j++) {
      const volume1 = data[j].volumes;
      
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
  const n = data.length;
  var jstat = this.jStat;

  var mat = createTriangularMatrix(n);
  for (var i=0; i<n; i++) {
    const volume = data[i].volumes;
    for (var j=0; j<i; j++) {
      const volume1 = data[j].volumes;
     
      var coef = jstat.corrcoeff(volume, volume1);
      mat[i][j] = coef;
    }
  }

  return mat;
}
