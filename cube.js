const catalogCube = require("./cpp/build/Release/catalogCube.node");
const ras = require("./rasbook");

function translateQuery(q0) {
  var q = q0;

  if ("msgID" in q) {
    var msgID = [];
    q0.msgID.forEach(function(e) { msgID.push(parseInt("0x" + e.toLowerCase(), 16)); });
    q.msgID = msgID;
  }

  if ("component" in q) q.component = translateNamesToIndices(q.component, ras.components);
  if ("locationType" in q) q.locationType = translateNamesToIndices(q.locationType, ras.locationTypes);
  if ("category" in q) q.category = translateNamesToIndices(q.category, ras.categories);
  if ("severity" in q) q.severity = translateNamesToIndices(q.severity, ras.severities);
  
  return q;
 
  function translateNamesToIndices(src, book) { // src is [], book is {}
    var dst = [];
    src.forEach(function(e) {
      var index = Object.keys(book).indexOf(e);
      dst.push(index);
    });
    return dst;
  }
}

function translateResults(r) {
  var msgID = {};
  for (var key in r.msgID) {
    var key1 = parseInt(key).toString(16).toUpperCase();
    while (key1.length < 8) key1 = "0" + key1;
    msgID[key1] = r.msgID[key];
  }
  r.msgID = msgID;

  r.component = translateIndicesToNames(r.component, ras.components);
  r.locationType = translateIndicesToNames(r.locationType, ras.locationTypes);
  r.category = translateIndicesToNames(r.category, ras.categories);
  r.severity = translateIndicesToNames(r.severity, ras.severities);

  return r;

  function translateIndicesToNames(src, book) { // src is [], book is {}
    var dst = {};
    var bookKeys = Object.keys(book);
    for (var key in src) {
      var key1 = bookKeys[key];
      dst[key1] = src[key];
    }
    return dst;
  }
}

function cube(filename) {
  this.cc = new catalogCube.catalogCube();
  this.cc.loadRASLog("raslog");
}

cube.prototype.query = function(q0) {
  q = translateQuery(q0);
  var r0 = this.cc.query(q);
  return translateResults(r0);
}

module.exports = {
  cube: cube
};

function test() {
  var mycube = new cube("raslog");

  var q = {}; 
  /*
  var q = {
    t0: 1436184000000,
    t1: 1436936400000,
    severity: ["FATAL"],
    component: ["CNK", "DIAGS"]
  }
  */
  console.log(mycube.query(q));
}

// test();
