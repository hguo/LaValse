const locationNarratives = {
  undefined: "undefined",
  "R": "Compute Rack",
  "RB": "Bulk Power Supply in Compute Rack",
  "RBP": "Power Modules in Compute Rack",
  "RM": "Midplane",
  "Q": "I/O Rack",
  "QB": "Bulk Power Supply in I/O Rack",
  "QBP": "Power Modules in I/O Rack",
  "RMS": "Service Card",
  "RK": "Clock Card in Compute Rack",
  "RI": "I/O Drawers in Compute Rack",
  "RMN": "Node Boards",
  "RMNJ": "Compute Cards on Node Board",
  "QK": "Clock Card in I/O Rack",
  "QI": "I/O Drawers in I/O Rack",
  "RIJ": "Compute Cards on I/O Boards in Compute Rack",
  "QIJ": "Compute Cards on I/O Boards in I/O Rack",
  "RMNJC": "Compute Card Cores on Node Board",
  "RIJC": "Compute Card Cores on I/O Boards in Compute Rack",
  "RMNU": "Link Module on Node Board",
  "RMND": "DCA on Node Board",
  "QIJC": "Compute Card Cores on I/O Boards in I/O Rack",
  "RIU": "Link Module on I/O Board in Compute Rack",
  "QIU": "Link Module on I/O Board in I/O Rack",
  "RID": "DCA on I/O Board in Compute Rack",
  "RMNO": "Optical Module on Node Board",
  "RIO": "Optical Module on I/O Board in Compute Rack",
  "RIH": "Fan Assembly in Compute Rack", 
  "RIHF": "Fans in Compute Rack",
  "QID": "DCA on I/O Board in I/O Rack",
  "QIO": "Optical Module on I/O Board in I/O Rack",
  "QIH": "Fan Assembly in I/O Rack",
  "QIHF": "Fans in I/O Rack",
  "RIA": "PCI Adapter Cards in Compute Racks",
  "RL": "Coolant Monitor in Compute Rack",
  "QIA": "PCI Adapter Cards in I/O Racks"
};

var parseNumberFunctions = {
  "A": function(s) {return [parseInt(s[1])]},
  "B": function(s) {return [parseInt(s[1])]},
  "C": function(s) {return [parseInt(s.slice(1, 3))]},
  "D": function(s) {return [parseInt(s[1])]},
  "F": function(s) {return [parseInt(s[1])]},
  "H": function(s) {return [parseInt(s[1])]},
  "I": function(s) {return [parseInt(s[1], 16)]},
  "J": function(s) {return [parseInt(s.slice(1, 3))]},
  // "K": function(s) {return [parseInt(s[1])]},
  "K": function(s) {return [0]}, // found NaN in the log
  "L": function(s) {return [0]}, 
  "M": function(s) {return [parseInt(s[1])]},
  "N": function(s) {return [parseInt(s.slice(1, 3))]},
  "O": function(s) {return [parseInt(s.slice(1, 3))]},
  "P": function(s) {return [parseInt(s[1])]},
  "Q": function(s) {return [parseInt(s[1], 32), parseInt(s[2], 32)]},
  "R": function(s) {return [parseInt(s[1], 32), parseInt(s[2], 32)]},
  "S": function(s) {return [0]},
  "U": function(s) {return [parseInt(s.slice(1, 3))]}
};

var parseFunctions = {
  "A": function(s) {
    const v = {"0": "right", "7": "left"}; 
    return {PCICard: v[s[1]]};
  },
  "B": function(s) {
    const v = {"0": "bottomFront", "1": "bottomRear"};
    if (s.length == 0) return {bulkPowerSupply: undefined};
    else return {bulkPowerSupply: v[s[1]]};
  }, 
  "C": function(s) {return {core: parseInt(s.slice(1, 3))};},
  "D": function(s) {return {DCA: parseInt(s[1])};},
  "F": function(s) {
    const v = {"0": "intake", "1": "exhaust"};
    return {fan: v[s[1]]};
  },
  "H": function(s) {
    const v = {"0": "PCI", "1": "computeCard"};
    return {fanAssembly: v[s[1]]};
  },
  "I": function(s) {
    const v = {
      "0": "bottom",
      "B": "top",
      "C": "bottomLeft",
      "D": "bottomRight",
      "E": "topLeft",
      "F": "topRight"
    }
    return {IODrawer: v[s[1]]};
  },
  "J": function(s) {return {computeCard: parseInt(s.slice(1, 3))};},
  "K": function(s) {
    const v = {"0": "bottom", "1": "top"};
    return {clockCard: v[s[1]]};
  }, 
  "L": function(s) {return {coolantMonitor: undefined};},
  "M": function(s) {return {midplane: parseInt(s[1])};},
  "N": function(s) {return {nodeBoard: parseInt(s.slice(1, 3))};},
  "O": function(s) {return {opticalModule: parseInt(s.slice(1, 3))};},
  "P": function(s) {
    const v = {
      "0": "bottom", // FIXME: bottomLeft for I/O rack
      "1": "bottomRight",
      "2": "middleLeft",
      "3": "middleRight",
      "4": "topLeft",
      "5": "topRight",
      "8": "top"
    };
    return {powerModule: v[s[1]]};
  },
  "Q": function(s) {return {row: parseInt(s[1], 32), column: parseInt(s[2], 32)};},
  "R": function(s) {return {row: parseInt(s[1], 32), column: parseInt(s[2], 32)};}, 
  "S": function(s) {return {serviceCard: undefined};},
  "U": function(s) {return {linkModule: parseInt(s.slice(1, 3))};}
}

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
    midplane: parseInt(str[5])
  }
}

function parseLocationType(str) {
  var substrings = str.split("-");
  var pattern = "";
  substrings.forEach(function(s) {pattern += s[0];});
  return pattern;
}

function parseLocationTypeInt(pattern) {
  var index = Object.keys(locationNarratives).indexOf(pattern);
  if (index < 0) console.error(index, pattern);
  return index;
}

function parseLocation(str) {
  var L = {}; // return value
  
  var substrings = str.split("-");
  var pattern = "";
  substrings.forEach(function(s) {pattern += s[0];});

  if (!(pattern in locationNarratives)) return L;

  L.string = str;
  L.pattern = pattern;
  L.narratives = locationNarratives[pattern];

  substrings.forEach(function(s) {
    attrs = parseFunctions[s[0]](s);
    for (var attrname in attrs) {L[attrname] = attrs[attrname];}
  });

  // console.log(L);
  return L;
}

function locationToFixedSizeArray(str) {
  var array = [];
  
  var substrings = str.split("-");
  var pattern = "";
  substrings.forEach(function(s) {pattern += s[0];});

  if (pattern.length == 0) pattern = undefined;
  array[0] = parseLocationTypeInt(pattern);

  substrings.forEach(function(s) {
    if (s.length > 0) {
      var array1 = parseNumberFunctions[s[0]](s);
      array.push.apply(array, array1);
    }
  });

  while (array.length < 6) 
    array.push(0);

  return array;
}

function locationStrToNodeBoardStr(str) {
  var L = parseLocation(str);
  if ((typeof L.pattern) == "string" && L.pattern.slice(0, 3) == "RMN") 
    return nodeBoard2str(L.row, L.column, L.midplane, L.nodeBoard);
  else 
    return undefined;
}

function parseRASMessageID(str) {
  return rasbook[str];
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
    column: 8*Math.floor(x/4) + f(Math.floor(z/4), Math.floor(w/4)), 
    midplane: C(Math.floor(w/4))
  }

  function f(a1, a2) {return H(a1) + Q(a2);}
  function H(z_4) {const table = [0, 4, 6, 2]; return table[z_4];}
  function Q(w_4) {return w_4<=1 ? 0 : 1;}
  function C(w_4) {const table = [0, 1, 1, 0]; return table[w_4];}
}

function parseComputeBlock(str) {
  // if (str.slice( == "_DIAGS_")

  var substrings = str.split("-");
  if (substrings[0] != "MIR") return new Set(); // empty set

  var s = parseTorusCoords(substrings[1]), 
      t = parseTorusCoords(substrings[2]);
  var nodeCount = parseInt(substrings[3]);
  var midplaneDict = {};
  var set = new Set();

  for (a=s.a; a<=t.a; a++) {
    for (b=s.b; b<=t.b; b++) {
      for (c=s.c; c<=t.c; c++) {
        for (d=s.d; d<=t.d; d++) {
          var mp = torusCoordsToMidplane(a, b, c, d);
          // midplaneDict[midplane2str(mp.row, mp.column, mp.midplane)] = 1;
          set.add(midplane2str(mp.row, mp.column, mp.midplane));
        }
      }
    }
  }

  return set;
}

module.exports = {
  parseLocation: parseLocation,
  parseLocationType: parseLocationType,
  parseLocationTypeInt: parseLocationTypeInt,
  locationToFixedSizeArray: locationToFixedSizeArray
};

// console.log(parseLocation("R1A-M1-N13"));
// parseComputeBlock("MIR-00000-73FF1-16384");
// console.log(locationToFixedSizeArray("Q0G-I6-J04"));
