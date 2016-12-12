const catalogCube = require("./cpp/build/Release/catalogCube.node");
// const catalogCube = require("./cpp/build/Debug/catalogCube.node");
const ras = require("./rasbook");

function translateQuery(q0) {
  var q = q0;

  if ("msgID" in q) q.msgID = translateNamesToIndices(q.msgID, ras.eventMap);
  if ("component" in q) q.component = translateNamesToIndices(q.component, ras.componentMap);
  if ("locationType" in q) q.locationType = translateNamesToIndices(q.locationType, ras.locationTypeMap);
  if ("category" in q) q.category = translateNamesToIndices(q.category, ras.categoryMap);
  if ("severity" in q) q.severity = translateNamesToIndices(q.severity, ras.severityMap);
  if ("RMN" in q) q.RMN = translateNamesToIndices(q.RMN, ras.RMNLocationMap);
  
  return q;
 
  function translateNamesToIndices(src, bimap) { // src is [], book is {}
    var dst = [];
    src.forEach(function(e) {
      dst.push(bimap.key(e));
    });
    return dst;
  }
}

function translateResults(r, fullResult) {
  r.msgID = translateIndicesToNames(r.msgID, ras.eventMap);
  r.component = translateIndicesToNames(r.component, ras.componentMap);
  r.locationType = translateIndicesToNames(r.locationType, ras.locationTypeMap);
  r.category = translateIndicesToNames(r.category, ras.categoryMap);
  r.severity = translateIndicesToNames(r.severity, ras.severityMap);
  r.RMN = translateIndicesToNames(r.RMN, ras.RMNLocationMap);

  if (fullResult != undefined || fullResult != null) {
    r.component = completeMissingResults(r.component, fullResult.component);
    r.locationType = completeMissingResults(r.locationType, fullResult.locationType);
    r.category = completeMissingResults(r.category, fullResult.category);
    r.severity = completeMissingResults(r.severity, fullResult.severity);
  }

  return r;

  function translateIndicesToNames(src, bimap) { // src is [], book is {}
    var dst = {};
    for (var key in src) {
      var key1 = bimap.val(key);
      dst[key1] = src[key];
    }
    return dst;
  }

  function completeMissingResults(partial, full) {
    var dst = {};
    for (var key in full)
      if (key in partial) 
        dst[key] = partial[key]; 
      else 
        dst[key] = 0;
    return dst;
  }
}

function cube(filename) {
  this.cc = new catalogCube.catalogCube();
  this.cc.loadRASLog("raslog");
  this.fullResult = this.query({});
}

cube.prototype.query = function(q0) {
  q = translateQuery(q0);
  var r0 = this.cc.query(q);
  return translateResults(r0, this.fullResult);
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
