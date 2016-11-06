// Given a code such as MIR-00000-73FF1-16384, it will return a list of midplanes
// returns a list of midplanes
function computeLocationBasedOnBlock(code) {
  var s = code.split("-");  
  var nodeCount = parseInt(s[3]);

  var location0 = computeMidplainLocation(s[1]);
  console.log(location0);

  // console.log(s);
}

function computeMidplainLocation(code) {
  var s = code.split("");

  var x = parseInt(s[0], 16), 
      y = parseInt(s[1], 16),
      z = parseInt(s[2], 16),
      w = parseInt(s[3], 16),
      row = y/4,
      column = 2*x + f(z/4, w/4),
      midplane = C(w/4);

  return {x: x, y: y, z: z, row: row, column: column, midplane: midplane};

  // var key = buildString(row, column, midplane);
  // console.log(row, column, midplane, x, y, z, w);

  function buildString(rackRow, rackCol, midplane) {
    return "R(" + rackRow + "," + rackCol + "),M" + midplane;
  }

  function f(a1, a2) {return H(a1) + Q(a2);}
  function H(z_4) {
    switch (z_4) {
      case 0: return 0;
      case 1: return 4;
      case 2: return 6;
      case 3: return 2;
      default: throw ("error");
    }
  }
  function Q(w_4) {return w_4<=1 ? 0 : 1;}
  function C(w_4) {
    switch (w_4) {
      case 0: return 0;
      case 1: return 1;
      case 2: return 1;
      case 3: return 0;
      default: throw ("error");
    }
  }
}

computeLocationBasedOnBlock("MIR-00000-73FF1-16384");