function pad(number, radix, length) {
  var str = number.toString(radix).toUpperCase();
  while (str.length < length) str = '0' + str;
  return str;
}

function rack2str(row, column) {
  return "R" + pad(row, 16, 1) + pad(column, 16, 1);
}

function midplane2str(row, column, midplane) { // midplane is either 0 or 1
  return rack2str(row, column) + "-M" + midplane;
}

function nodeBoard2str(row, column, midplane, nodeBoard) {
  return midplane2str(row, column, midplane) + "-N" + pad(nodeBoard, 10, 2);
}

function parseMidplane(str) { // input: Rxx-Mx
  return {
    row: parseInt(str[1], 16), 
    column: parseInt(str[2], 16),
    midplane: parseInt(str[5], 16)
  }
}

function parseTorusCoords(str) {
  return {
    a: parseInt(str[0], 16), 
    b: parseInt(str[1], 16), 
    c: parseInt(str[2], 16),
    d: parseInt(str[3], 16),
    e: parseInt(str[4], 16)
  }
}

function torusCoordsToMidplane(x, y, z, w) {
  return {
    row: Math.floor(y/4), 
    column: 2*x + f(Math.floor(z/4), Math.floor(w/4)), 
    midplane: C(Math.floor(w/4))
  }

  function f(a1, a2) {return H(a1) + Q(a2);}
  function H(z_4) {const table = [0, 4, 6, 2]; return table[z_4];}
  function Q(w_4) {return w_4<=1 ? 0 : 1;}
  function C(w_4) {const table = [0, 1, 1, 0]; return table[w_4];}
}

function midplaneToStr(row, column, midplane) {
  return "R" + rackRow + "," + rackCol + "),M" + midplane;
}

function parseComputeBlock(str) {
  var substrings = str.split("-");
  var s = parseTorusCoords(substrings[1]), 
      t = parseTorusCoords(substrings[2]);
  var nodeCount = parseInt(substrings[3]);
  var midplaneDict = {};
  var set = new Set();

  for (a=s.a; a<=t.a; a++) {
    for (b=s.b; b<=t.b; b++) {
      for (c=s.c; c<=t.c; c++) {
        for (d=s.d; d<=t.d; d++) {
          var mp = torusCoordsToMidplane(b, a, c, d);
          // midplaneDict[midplane2str(mp.row, mp.column, mp.midplane)] = 1;
          set.add(midplane2str(mp.row, mp.column, mp.midplane));
        }
      }
    }
  }

  return set;
  // console.log(set);
}

// parseComputeBlock("MIR-00000-73FF1-16384");
