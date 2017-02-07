const locationNarratives = {
"": "undef",
"R": "Compute Rack",
"RB": "Bulk Power Supply in Compute Rack",
"RBP": "Power Modules in Compute Rack",
"RK": "Clock Card in Compute Rack",
"RL": "Coolant Monitor in Compute Rack",
"RM": "Midplane",
"RMS": "Service Card",
"RMN": "Node Boards",
"RMNU": "Link Module on Node Board",
"RMND": "DCA on Node Board",
"RMNO": "Optical Module on Node Board",
"RMNJ": "Compute Cards on Node Board",
"RMNJC": "Compute Card Cores on Node Board",
"RI": "I/O Drawers in Compute Rack",
"RIH": "Fan Assembly in Compute Rack", 
"RIHF": "Fans in Compute Rack",
"RIA": "PCI Adapter Cards in Compute Racks",
"RIU": "Link Module on I/O Board in Compute Rack",
"RID": "DCA on I/O Board in Compute Rack",
"RIO": "Optical Module on I/O Board in Compute Rack",
"RIJ": "Compute Cards on I/O Boards in Compute Rack",
"RIJC": "Compute Card Cores on I/O Boards in Compute Rack",
"Q": "I/O Rack",
"QB": "Bulk Power Supply in I/O Rack",
"QBP": "Power Modules in I/O Rack",
"QK": "Clock Card in I/O Rack",
"QI": "I/O Drawers in I/O Rack",
"QIA": "PCI Adapter Cards in I/O Racks",
"QIJ": "Compute Cards on I/O Boards in I/O Rack",
"QIJC": "Compute Card Cores on I/O Boards in I/O Rack",
"QIU": "Link Module on I/O Board in I/O Rack",
"QID": "DCA on I/O Board in I/O Rack",
"QIO": "Optical Module on I/O Board in I/O Rack",
"QIH": "Fan Assembly in I/O Rack",
"QIHF": "Fans in I/O Rack",
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
  "B": function(s) {return {bulkPowerSupply: parseInt(s[1])};},
  /* // legacy
    const v = {"0": "bottomFront", "1": "bottomRear"};
    if (s.length == 0) return {bulkPowerSupply: undefined};
    else return {bulkPowerSupply: v[s[1]]};
  },*/
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
    /*
    const v = {
      "0": "bottom",
      "B": "top",
      "C": "bottomLeft",
      "D": "bottomRight",
      "E": "topLeft",
      "F": "topRight"
    }
    return {IODrawer: v[s[1]]};
    */
    return {IODrawer: parseInt(s[1])};
  },
  "J": function(s) {return {computeCard: parseInt(s.slice(1, 3))};},
  "K": function(s) {return {clockCard: undefined};},
  /* // legacy
    const v = {"0": "bottom", "1": "top"};
    return {clockCard: v[s[1]]};
  }, 
  */
  "L": function(s) {return {coolantMonitor: undefined};},
  "M": function(s) {return {midplane: parseInt(s[1])};},
  "N": function(s) {return {nodeBoard: parseInt(s.slice(1, 3))};},
  "O": function(s) {return {opticalModule: parseInt(s.slice(1, 3))};},
  "P": function(s) {return {powerModule: parseInt(s[1])};}, 
  /* // legacy code
    const v = {
      "0": "bottom", 
      "1": "bottomRight",
      "2": "middleLeft",
      "3": "middleRight",
      "4": "topLeft",
      "5": "topRight",
      "8": "top"
    };
    return {powerModule: v[s[1]]};
  },*/
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
  return "R" + pad(row, 32, 1) + pad(column, 32, 1);
}

function clockCard2str(row, col) {
  return rack2str(row, col) + "-K";
}

function coolantMonitor2str(row, col) {
  return rack2str(row, col) + "-L";
}

function bulkPowerSupply2str(row, column, bulkPowerSupply) {
  return rack2str(row, column) + "-B" + bulkPowerSupply;
}

function powerModule2str(row, column, bulkPowerSupply, powerModule) {
  return bulkPowerSupply2str(row, column, bulkPowerSupply) + "-P" + powerModule;
}

function midplane2str(row, column, midplane) { // midplane is either 0 or 1
  return rack2str(row, column) + "-M" + midplane;
}

function serviceCard2str(row, col, mp) {
  return midplane2str(row, col, mp) + "-S";
}

function nodeBoard2str(row, column, midplane, nodeBoard) {
  return midplane2str(row, column, midplane) + "-N" + pad(nodeBoard, 10, 2);
}

function computeCard2str(row, col, mp, nb, cc) {
  return nodeBoard2str(row, col, mp, nb) + "-J" + pad(cc, 10, 2);
}

function linkModule2str(row, col, mp, nb, u) {
  return nodeBoard2str(row, col, mp, nb) + "-U" + pad(u, 10, 2);
}

function DCA2str(row, col, mp, nb, d) {
  return nodeBoard2str(row, col, mp, nb) + "-D" + d;
}

function opticalModule2str(row, col, mp, nb, o) {
  return nodeBoard2str(row, col, mp, nb) + "-O" + pad(o, 10, 2);
}

function ioRack2str(row, column) {
  return "Q" + pad(row, 32, 1) + pad(column, 32, 1);
}

function ioDrawer2str(row, column, drawer) {
  return ioRack2str(row, column) + "-I" + pad(drawer, 16, 1);
}

function ioComputeCard2str(row, col, drawer, j) {
  return ioDrawer2str(row, col, drawer) + "-J" + pad(j, 10, 2);
}

function ioLinkModule2str(row, col, drawer, u) {
  return ioDrawer2str(row, col, drawer) + "-U" + pad(u, 10, 2);
}

function ioDCA2str(row, col, drawer, d) {
  return ioDrawer2str(row, col, drawer) + "-D" + d;
}

function ioOpticalModule2str(row, col, drawer, o) {
  return ioDrawer2str(row, col, drawer) + "-O" + pad(o, 10, 2);
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
  var type = "";
  substrings.forEach(function(s) {type += s[0];});
  return type;
}

function parseLocationTypeInt(type) {
  var index = Object.keys(locationNarratives).indexOf(type);
  if (index < 0) console.error(index, type);
  return index;
}

function parseLocation(str) {
  var L = {}; // return value
  L.str = str;
  
  var substrings = str.split("-");
  var type = "";
  substrings.forEach(function(s) {type += s[0];});

  if (str.length == 0) {
    L.type = "";
    return L;
  }
  if (!(type in locationNarratives)) return L;

  L.type = type;
  L.narratives = locationNarratives[type];

  substrings.forEach(function(s) {
    attrs = parseFunctions[s[0]](s);
    for (var attrname in attrs) {L[attrname] = attrs[attrname];}
  });

  // console.log(L);
  return L;
}

function locationStrToNodeBoardStr(str) {
  var L = parseLocation(str);
  if ((typeof L.type) == "string" && L.type.slice(0, 3) == "RMN") 
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

function locationToL0Location(L) {
  return L.str;
}

function locationToL1Location(L) {
  switch (L.type) {
  case "R": return rack2str(L.row, L.column);
  case "RL": return L.str;
  case "RK": return L.str;
  case "RB": 
  case "RBP":
    return bulkPowerSupply2str(L.row, L.column, L.bulkPowerSupply);

  case "RM":
    return midplane2str(L.row, L.column, L.midplane);
  case "RMS":
    return midplane2str(L.row, L.column, L.midplane) + "-S";

  case "RMN": return nodeBoard2str(L.row, L.column, L.midplane, L.nodeBoard);
  case "RMNJ": return nodeBoard2str(L.row, L.column, L.midplane, L.nodeBoard) + "-J";
  case "RMNU": return nodeBoard2str(L.row, L.column, L.midplane, L.nodeBoard) + "-U";
  case "RMND": return nodeBoard2str(L.row, L.column, L.midplane, L.nodeBoard) + "-D";
  case "RMNO": return nodeBoard2str(L.row, L.column, L.midplane, L.nodeBoard) + "-O";
 
  case "Q": return ioRack2str(L.row, L.column);
  case "QI": return ioDrawer2str(L.row, L.column, L.IODrawer);
  case "QIJ": return ioDrawer2str(L.row, L.column, L.IODrawer) + "-J"; 
  case "QIU": return ioDrawer2str(L.row, L.column, L.IODrawer) + "-U"; 
  case "QID": return ioDrawer2str(L.row, L.column, L.IODrawer) + "-D"; 
  case "QIO": return ioDrawer2str(L.row, L.column, L.IODrawer) + "-O";
  default: return "";
  }
}

function locationToL2Location(L) {
  switch (L.type) {
  case "R": return rack2str(L.row, L.column);
  case "RL": return L.str;
  case "RK": return L.str;
  case "RB":
  case "RBP":
    // return bulkPowerSupply2str(L.row, L.column, L.bulkPowerSupply);
    return rack2str(L.row, L.column) + "-B";
  case "RM":
    return midplane2str(L.row, L.column, L.midplane);
  case "RMS": 
    return midplane2str(L.row, L.column, L.midplane) + "-S";

  case "RMN":
  case "RMNJ":
  case "RMNU": 
  case "RMND": 
  case "RMNO": 
    return nodeBoard2str(L.row, L.column, L.midplane, L.nodeBoard);

  case "Q": return ioRack2str(L.row, L.column);

  case "QI":
  case "QIJ":
  case "QIU":
  case "QID":
  case "QIO": 
    return ioDrawer2str(L.row, L.column, L.IODrawer);

  default: return "";
  }
}

function locationToL3Location(L) {
  switch (L.type) {
  case "R": return rack2str(L.row, L.column);
  case "RL": return L.str;
  case "RK": return L.str;
  case "RB": 
  case "RBP":
    return rack2str(L.row, L.column) + "-B";
  case "RM":
  case "RMS":
  case "RMN":
  case "RMNJ":
  case "RMNU": 
  case "RMND": 
  case "RMNO": 
    return midplane2str(L.row, L.column, L.midplane);

  case "Q":
  case "QI":
  case "QIJ":
  case "QIU":
  case "QID":
  case "QIO":
    return ioRack2str(L.row, L.column);
  
  default: return "";
  }
}

function locationToL4Location(L) {
  switch (L.type) {
  case "R": 
  case "RL":
  case "RK":
  case "RB": 
  case "RBP":
  case "RM":
  case "RMS":
  case "RMN":
  case "RMNJ":
  case "RMNU": 
  case "RMND": 
  case "RMNO": 
    return rack2str(L.row, L.column);

  case "Q":
  case "QI":
  case "QIJ":
  case "QIU":
  case "QID":
  case "QIO":
    return ioRack2str(L.row, L.column);

  default: return "";
  }
}

function locationToMidplane(L) {
  switch (L.type) {
  case "RM":
  case "RMS":
  case "RMN":
  case "RMNJ":
  case "RMNU": 
  case "RMND": 
  case "RMNO": 
    return midplane2str(L.row, L.column, L.midplane);

  default: return "";
  }
}

function enumerateMidplanes() {
  var locations = [""];
  for (row=0; row<3; row++) {
    for (col=0; col<16; col++) {
      for (mp=0; mp<2; mp++) {
        locations.push(midplane2str(row, col, mp));
      }
    }
  }
  return locations;
}

function locationToLODLocation(L) {
  return [
    locationToL0Location(L),
    locationToL1Location(L),
    locationToL2Location(L),
    locationToL3Location(L),
    locationToL4Location(L)
  ];
}

function enumerateL0Locations() {
  var locations = [""];
  for (row=0; row<3; row++) {
    for (col=0; col<16; col++) {
      var rack = rack2str(row, col);
      locations.push(rack);
      locations.push(rack + "-K");
      locations.push(rack + "-L");

      for (bulkPowerSupply=0; bulkPowerSupply<4; bulkPowerSupply++) {
        locations.push(bulkPowerSupply2str(row, col, bulkPowerSupply));
        for (powerModule=0; powerModule<9; powerModule++) {
          locations.push(powerModule2str(row, col, bulkPowerSupply, powerModule));
        }
      }

      for (mp=0; mp<2; mp++) {
        var midplane = midplane2str(row, col, mp);
        locations.push(midplane);
        locations.push(midplane + "-S");

        for (nb=0; nb<16; nb++) {
          var nodeBoard = nodeBoard2str(row, col, mp, nb);
          locations.push(nodeBoard);
          for (j=0; j<32; j++) locations.push(computeCard2str(row, col, mp, nb, j));
          for (u=0; u<9; u++) locations.push(linkModule2str(row, col, mp, nb, u));
          for (d=0; d<2; d++) locations.push(DCA2str(row, col, mp, nb, d));
          for (o=0; o<36; o++) locations.push(opticalModule2str(row, col, mp, nb, o));
        }
      }
    }
  }

  for (row=0; row<3; row++) {
    for (col=16; col<18; col++) { // G to H
      locations.push(ioRack2str(row, col));
      for (drawer=0; drawer<10; drawer++) {
        var ioDrawer = ioDrawer2str(row, col, drawer);
        locations.push(ioDrawer);
        for (j=0; j<8; j++) locations.push(ioComputeCard2str(row, col, drawer, j));
        for (u=0; u<6; u++) locations.push(ioLinkModule2str(row, col, drawer, u));
        for (d=0; d<2; d++) locations.push(ioDCA2str(row, col, drawer, d));
        for (o=0; o<24; o++) locations.push(ioOpticalModule2str(row, col, drawer, o));
      }
    }
  }

  return locations;
}

function enumerateL1Locations() {
  var locations = [""];
  for (row=0; row<3; row++) {
    for (col=0; col<16; col++) {
      var rack = rack2str(row, col);
      locations.push(rack);
      locations.push(rack + "-K");
      locations.push(rack + "-L");

      for (bulkPowerSupply=0; bulkPowerSupply<4; bulkPowerSupply++) {
        locations.push(bulkPowerSupply2str(row, col, bulkPowerSupply));
      }

      for (mp=0; mp<2; mp++) {
        var midplane = midplane2str(row, col, mp);
        locations.push(midplane);
        locations.push(midplane + "-S");

        for (nb=0; nb<16; nb++) {
          var nodeBoard = nodeBoard2str(row, col, mp, nb);
          locations.push(nodeBoard);
          locations.push(nodeBoard + "-J");
          locations.push(nodeBoard + "-U");
          locations.push(nodeBoard + "-D");
          locations.push(nodeBoard + "-O");
        }
      }
    }
  }

  for (row=0; row<3; row++) {
    for (col=16; col<18; col++) { // G to H
      locations.push(ioRack2str(row, col));
      for (drawer=0; drawer<10; drawer++) {
        var ioDrawer = ioDrawer2str(row, col, drawer);
        locations.push(ioDrawer);
        locations.push(ioDrawer + "-J");
        locations.push(ioDrawer + "-U");
        locations.push(ioDrawer + "-D");
        locations.push(ioDrawer + "-O");
      }
    }
  }

  return locations;
}

function enumerateL2Locations() {
  var locations = [""];
  for (row=0; row<3; row++) {
    for (col=0; col<16; col++) {
      var rack = rack2str(row, col);
      locations.push(rack);
      locations.push(rack + "-B");
      locations.push(rack + "-K");
      locations.push(rack + "-L");

      for (mp=0; mp<2; mp++) {
        var midplane = midplane2str(row, col, mp);
        locations.push(midplane);
        locations.push(midplane + "-S");

        for (nb=0; nb<16; nb++) {
          locations.push(nodeBoard2str(row, col, mp, nb));
        }
      }
    }
  }
  
  for (row=0; row<3; row++) {
    for (col=16; col<18; col++) {// G to H
      locations.push(ioRack2str(row, col));
      for (drawer=0; drawer<10; drawer++) {
        locations.push(ioDrawer2str(row, col, drawer));
      }
    }
  }

  return locations;
}

function enumerateL3Locations() {
  var locations = [""];
  for (row=0; row<3; row++) {
    for (col=0; col<16; col++) {
      var rack = rack2str(row, col);
      locations.push(rack);
      locations.push(rack + "-B");
      locations.push(rack + "-K");
      locations.push(rack + "-L");
      locations.push(rack + "-M0");
      locations.push(rack + "-M1");
    }
  }
  
  for (row=0; row<3; row++) {
    for (col=16; col<18; col++) {// G to H
      locations.push(ioRack2str(row, col));
    }
  }

  return locations;
}

function enumerateL4Locations() {
  var locations = [""];
  for (row=0; row<3; row++) {
    for (col=0; col<16; col++) {
      locations.push(rack2str(row, col));
    }
  }

  for (row=0; row<3; row++) {
    for (col=16; col<18; col++) {// G to H
      locations.push(ioRack2str(row, col));
    }
  }

  return locations;
}

var partitionParser = new function() {
  var cache = {};
  var cacheList = {};
  var cacheComponents = {};
  
  this.init = function(data) { // init from pre-generated maps
    data.forEach(function(d) {
      var array = [];
      for (var i=0; i<d.str.length; i++) {
        if (d.str[i] == "1") array.push(true);
        else array.push(false);
      }
      cache[d.partition] = array;
    });
  }

  this.parse = function(str) {
    if (str in cache) {
      return cache[str];
    } else {
      var result = this.parse1(str);
      cache[str] = result;
      return result;
    }
  }
 
  this.list = function(str) {
    if (str in cacheList) {
      return cacheList[str];
    } else {
      var result = this.list1(str);
      cacheList[str] = result;
      return result;
    }
  }

  this.contour = function(str) {
    const N = 96;
    var array = this.parse(str);
    var min, max;
    for (var i=0; i<N; i++) {
      if (array[i]) {
        min = i; 
        break;
      }
    }
    for (var i=N-1; i>=0; i--) {
      if (array[i]) {
        max = i;
        break;
      }
    }
    return {min: min, max: max};
  }

  this.components = function(str) {
    if (str in cacheComponents) {
      return cacheComponents[str];
    } else {
      var result = this.components1(str);
      cacheComponents[str] = result;
      return result;
    }
  }

  this.components1 = function(str) {
    const N = 96;
    var array = this.parse(str);
    var results = [];
    
    for (var i=0; i<N; i++) {
      if (array[i]) {
        for (var j=i+1; j<N; j++) {
          if (array[j]) {
            if (j>=N-1) {
              results.push([i, j-i+1]);
              i = j+1;
              break;
            } else continue;
          } else {
            results.push([i, j-i]);
            i = j+1;
            break;
          }
        }
      }
    }

    return results;
  }

  this.list1 = function(str) {
    var array = this.parse(str);
    var L = [];
    for (var i=0; i<96; i++) {
      if (array[i]) {
        var row = Math.floor(i/32), col = Math.floor(i/2)%16, mp = i%2;
        L.push(midplane2str(row, col, mp));
      }
    }
    return L;
  }

  this.parse1 = function(str) {
    var substrings = str.split("-");
    var midplanes = new Array(96);
    for (var i=0; i<midplanes.length; i++) midplanes[i] = false;

    if (substrings[0] != "MIR") return midplanes;

    var s = parseTorusCoords(substrings[1]), 
        t = parseTorusCoords(substrings[2]);
    var nodeCount = parseInt(substrings[3]); // FIXME
    // var set = new Set();

    for (a=s.a; a<=t.a; a++) {
      for (b=s.b; b<=t.b; b++) {
        for (c=s.c; c<=t.c; c++) {
          for (d=s.d; d<=t.d; d++) {
            var mp = torusCoordsToMidplane(a, b, c, d);
            var idx = (mp.row * 16 + mp.column) * 2 + mp.midplane;
            midplanes[idx] = true;
            // set.add(midplane2str(mp.row, mp.column, mp.midplane));
          }
        }
      }
    }

    return midplanes;
  }
}

// var parser = new partitionParser;
// console.log(parser.parse("MIR-08000-7BFF1-0010-12288"));
// console.log(parseLocation("R1A-M1-N13"));
// parseComputeBlock("MIR-00000-73FF1-16384");

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    pad: pad,
    rack2str: rack2str,
    ioRack2str: ioRack2str,
    ioDrawer2str: ioDrawer2str,
    midplane2str: midplane2str,
    nodeBoard2str: nodeBoard2str,
    computeCard2str: computeCard2str,
    partitionParser: partitionParser,
    parseLocation: parseLocation,
    parseLocationType: parseLocationType,
    parseLocationTypeInt: parseLocationTypeInt,
    enumerateMidplanes: enumerateMidplanes,
    enumerateL0Locations: enumerateL0Locations,
    enumerateL1Locations: enumerateL1Locations,
    enumerateL2Locations: enumerateL2Locations,
    enumerateL3Locations: enumerateL3Locations,
    enumerateL4Locations: enumerateL4Locations,
    locationToL0Location: locationToL0Location,
    locationToL1Location: locationToL1Location,
    locationToL2Location: locationToL2Location,
    locationToL3Location: locationToL3Location,
    locationToL4Location: locationToL4Location,
    locationToLODLocation: locationToLODLocation,
    locationToMidplane: locationToMidplane,
    computeCard2str: computeCard2str
  };
}

/*
var locations = enumerateL2Locations();
// console.log(locations.length);
for (var i=0; i<locations.length; i++) {
  console.log(locations[i]);
  // var L = parseLocation(locations[i]);
  // console.log(locations[i], locationToL4Location(L));
}
*/
