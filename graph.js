const csvLoader = require("csv-load-sync");
const mira = require("./mira");

function torusToString(a, b, c, d, e) {
  var str = a.toString(16) + b.toString(16) + c.toString(16) + d.toString(16) + e.toString(16);
  return str.toUpperCase();
}

var torusRMNJMap = new function() {
  var torusMap = {};
  var RMNJMap = {};

  var array = csvLoader("torusRMNJ.csv");
  array.forEach(function(d) {
    torusMap[d.torus] = d.RMNJ;
    RMNJMap[d.RMNJ] = d.torus;
  });

  this.torus = function(RMNJ) {
    return RMNJMap[RMNJ];
  }
  
  this.RMNJ = function(torus) {
    return torusMap[torus];
  }

  this.neighbors = function(coords) {
    function R(a, l, inc) { // a is the char that encodes the coordinate, l is the limit
      var A = (parseInt(a, 16) + inc + l) % l;
      return A.toString(16).toUpperCase();
    }
    function S(coords, i, inc) {
      const limits = [8, 12, 16, 16, 2];
      var digit = R(coords[i], limits[i], inc);
      var str = "";
      for (var j=0; j<5; j++) 
        if (i == j) str += digit; 
        else str += coords[j];
      return str;
    }
    return {
      Ar: S(coords, 0, -1),
      At: S(coords, 0, 1),
      Br: S(coords, 1, -1),
      Bt: S(coords, 1, 1),
      Cr: S(coords, 2, -1),
      Ct: S(coords, 2, 1),
      Dr: S(coords, 3, -1),
      Dt: S(coords, 3, 1),
      Er: S(coords, 4, -1),
      Et: S(coords, 4, 1),
    };
  }

  this.neighborsRMNJ = function(coords) {
    var n = this.neighbors(coords);
    for (var key in n) {
      n[key] = this.RMNJ(n[key]);
    }
    return n;
  }
}

const directions = ["Ar", "At", "Br", "Bt", "Cr", "Ct", "Dr", "Dt"];
var RMNMap = {};
var RMMap = {};

for (var row=0; row<3; row++) {
  for (var col=0; col<16; col++) {
    for (var mp=0; mp<2; mp++) {
      for (var nb=0; nb<16; nb++) {
        for (var j=0; j<32; j++) {
          var RMNJ = mira.computeCard2str(row, col, mp, nb, j);
          var coords = torusRMNJMap.torus(RMNJ);
          var neighbors = torusRMNJMap.neighborsRMNJ(coords);

          var RMN = RMNJ.substring(0, 10);
          if (!(RMN in RMNMap)) RMNMap[RMN] = {};

          var RM = RMNJ.substring(0, 6);
          if (!(RM in RMMap)) RMMap[RM] = {};

          directions.forEach(function(d) {
            var RMNJ1 = neighbors[d];
            var RMN1 = RMNJ1.substring(0, 10);
            if (!(RMN===RMN1)) {
              RMNMap[RMN][d] = RMN1;
            }
            var RM1 = RMNJ1.substring(0, 6);
            if (!(RM===RM1)) {
              RMMap[RM][d] = RM1;
            }
          });

          // console.log(RMNJ, torusRMNJMap.neighborsRMNJ(coords).Dt);
        }
      }
    }
  }
}

// console.log(RMNMap);
// console.log(RMMap);

/*
console.log("RM,Ar,At,Br,Bt,Cr,Ct,Dr,Dt");
for (var key in RMMap) {
  var RM = RMMap[key];
  var array = [key, RM.Ar, RM.At, RM.Br, RM.Bt, RM.Cr, RM.Ct, RM.Dr, RM.Dt];
  console.log(array.join(","));
} */

/*
console.log("RMN,Ar,At,Br,Bt,Cr,Ct,Dr,Dt");
for (var key in RMNMap) {
  var RMN = RMNMap[key];
  var array = [key, RMN.Ar, RMN.At, RMN.Br, RMN.Bt, RMN.Cr, RMN.Ct, RMN.Dr, RMN.Dt];
  console.log(array.join(","));
} */

console.log("RMNJ,coords,Ar,At,Br,Bt,Cr,Ct,Dr,Dt,Er,Et");
for (var a=0; a<8; a++) {
  for (var b=0; b<12; b++) {
    for (var c=0; c<16; c++) {
      for (var d=0; d<16; d++) {
        for (var e=0; e<2; e++) {
          var coords = torusToString(a, b, c, d, e);
          var RMNJ = torusRMNJMap.RMNJ(coords);
          var n = torusRMNJMap.neighborsRMNJ(coords);
          var array = [RMNJ, coords, n.Ar, n.At, n.Br, n.Bt, n.Cr, n.Ct, n.Dr, n.Dt, n.Er, n.Et];

          console.log(array.join(","));
        }
      }
    }
  }
}
