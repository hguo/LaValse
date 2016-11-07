// Given a code such as MIR-00000-73FF1-16384, it will return a list of midplanes
// returns a list of midplanes
function computeLocationBasedOnBlock(code) {
  var s = code.split("-");  
  var nodeCount = parseInt(s[3]);
  var eList = [];

  var firstMidplaneCode = s[1];
  var mp = computeMidplainLocationFromCode(firstMidplaneCode);
  eList.push(mp);

  var x1 = mp.x,
      y1 = mp.y,
      x1_mod = x1 % 4,
      y1_mod = y1 % 4,
      x1_num = x1 - x1_mod,
      y1_num = y1 - y1_mod;

  var maxNum_firstMidplane = x1_num * y1_num * 32;
  var restNBNumAfterfirstMidplane = nodeCount - maxNum_firstMidplane;
  var restMidNum = idivup(restNBNumAfterfirstMidplane, 512);

  for (i=0; i<restMidNum; i++) {
    mp = getNextMidplainLocation(mp);
    eList.push(mp);
  }

  var secondMidplaneCode = s[2];
  var cc = secondMidplaneCode.split("");
  var x2 = parseInt(cc[0], 16), 
      y2 = parseInt(cc[1], 16),
      x2_mod = x2 % 4, 
      y2_mod = y2 % 4;

  // console.log(s);

  console.log(eList);
  return eList;

  function idivup(a, b) {return (a % b != 0) ? (a / b + 1) : (a / b);}
}

function computeMidplainLocationFromCode(code) {
  var s = code.split("");

  var x = parseInt(s[0], 16), 
      y = parseInt(s[1], 16),
      z = parseInt(s[2], 16),
      w = parseInt(s[3], 16);

  return computeMidplainLocationFromXYZW(x, y, z, w);

  function buildString(rackRow, rackCol, midplane) {
    return "R(" + rackRow + "," + rackCol + "),M" + midplane;
  }
}

function computeMidplainLocationFromXYZW(x, y, z, w) {
  return {
    x: x, 
    y: y, 
    z: z, 
    w: w,
    row: y/4,
    column: 2*x + f(z/4, w/4), 
    midplane: C(w/4)
  };

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

function getNextMidplainLocation(m) {
  var x = 0, y = 0, z = 0, w = 0;
  if(m.w != 12) //jump to the next small block (midplane)
  {
    w = m.w + 4;
  }
  else //w==12
  {
    if(m.z==12) //jump to the next big block (8 racks)
    {
      if(m.x==0)
      {
        x = m.x + 4;
        y = m.y;
      }
      else //x==4
      {
        x = 0;
        y = m.y + 4;
      }
    }
    else //jump to the next median-size block (a pair of rack)
    {
      z = m.z + 4;
    }
  }
  return computeMidplainLocationFromXYZW(x, y, z, w);
}

computeLocationBasedOnBlock("MIR-00000-73FF1-16384");