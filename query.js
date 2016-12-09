const catalogCube = require("./cpp/build/Release/catalogCube.node");
const ras = require("./rasbook");

var cube = new catalogCube.catalogCube();
cube.loadRASLog("raslog");

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

function translateResults(r0) {
  var r = r0;

  r.msgID = {};
  for (var key in r0.msgID) 
    r.msgID[key.toString(16).toUpperCase()] = r0[key];

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

function query(q0) {
  q = translateQuery(q0);
  var r0 = cube.query(q);
  return translateResults(r0);
}

// var q = {}; 
var q = {
  t0: 1436184000000,
  t1: 1436936400000,
  severity: ["FATAL"],
  component: ["CNK", "DIAGS"]
}
console.log(query(q));

module.exports = {
  query: query
};
