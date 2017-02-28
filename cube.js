const catalogCube = require("./cpp/build/Release/catalogCube.node");
// const catalogCube = require("./cpp/build/Debug/catalogCube.node");
const ras = require("./rasbook");
const analysis = require("./analysis");

const volumeByMap = {
  "all": 0,
  "msgID": 1,
  "component": 2, 
  "locationType": 3,
  "category": 4,
  "severity": 5
};

function translateQuery(q0) {
  var q = q0;

  if ("volumeBy" in q) q.volumeBy = volumeByMap[q.volumeBy];
  if ("msgID" in q) q.msgID = translateNamesToIndices(q.msgID, ras.eventMap);
  if ("component" in q) q.component = translateNamesToIndices(q.component, ras.componentMap);
  if ("locationType" in q) q.locationType = translateNamesToIndices(q.locationType, ras.locationTypeMap);
  if ("category" in q) q.category = translateNamesToIndices(q.category, ras.categoryMap);
  if ("severity" in q) q.severity = translateNamesToIndices(q.severity, ras.severityMap);
  if ("controlAction" in q) q.controlAction = translateNamesToIndices(q.controlAction, ras.controlActionMap);
  if ("LOD" in q && "location" in q) {
    q.location = translateNamesToIndices(q.location, ras.locationMaps[q.LOD]);
  }

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
  r.controlAction = translateIndicesToNames(r.controlAction, ras.controlActionMap);

  r.location = translateIndicesToNames(r.location, ras.locationMaps[r.LOD]);

  if (fullResult != undefined || fullResult != null) {
    r.component = completeMissingResults(r.component, fullResult.component);
    r.locationType = completeMissingResults(r.locationType, fullResult.locationType);
    r.category = completeMissingResults(r.category, fullResult.category);
    r.severity = completeMissingResults(r.severity, fullResult.severity);
    r.controlAction = completeMissingResults(r.controlAction, fullResult.controlAction);
  }

  r.recIDs = filterRecIDs(r.timeVolumes, r.timeVolumesRecID);
  delete r["timeVolumesRecID"];

  r.arcs = translateTimeVolumesMsgID(r.timeVolumesMsgID);
  r.msgIDVolumes = reduceTimeVolumesMsgID(r.timeVolumesMsgID).data;
  // console.log(analysis.temporalMsgIdDTW(r.msgIDVolumes));
  delete r["timeVolumesMsgID"];

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

  function translateTimeVolumesMsgID(volumes) {
    const nMsgIDs = volumes.length;
    const nSlots = volumes[0].length;
    var results = {};

    for (var i=0; i<nMsgIDs; i++) {
      var msgID = ras.eventMap.val(i);
      if (!(msgID in results)) results[msgID] = [];

      for (var j=0; j<nSlots; j++) {
        if (volumes[i][j] != 0) {
          results[msgID].push(j);
        }
      }

      if (results[msgID].length == 0) delete results[msgID];
    }
    return results;
  }
  
  function reduceTimeVolumesMsgID(timeVolumesByMsgID, normalize) { // remove volumes that are all zero; convert arrays to key-value pairs
    const nslots = timeVolumesByMsgID[0].length;
   
    var validMsgIDs = [];
    var data = {};
    for (var i=0; i<timeVolumesByMsgID.length; i++) {
      var volume = timeVolumesByMsgID[i];
      var sum = volume.reduce(function(acc, val) {return acc + val;});
      if (sum != 0) {
        var msgID = ras.eventMap.val(i);
        validMsgIDs.push(msgID);
        if (normalize)
          for (var j=0; j<volume.length; j++) 
            volume[j] = volume[j] == 0 ? 0 : 1;
        data[msgID] = volume;
      }
    }

    return {msgIDs: validMsgIDs, data: data};
  }
}

function filterRecIDs(volumes, recIDs) {
  const threshold = 20;
  var totalVolume = []; 
  for (j=0; j<volumes[0].length; j++) 
    totalVolume.push(0);
  
  for (i=0; i<volumes.length; i++) {
    for (j=0; j<volumes[i].length; j++) {
      totalVolume[j] = totalVolume[j] + volumes[i][j];
    }
  }

  for (j=0; j<totalVolume.length; j++) 
    if (totalVolume[j] > threshold) return [];

  var outputs = [];
  for (j=0; j<volumes[0].length; j++) {
    if (totalVolume[j] <= threshold) {
      // console.log(j, totalVolume[j])
      for (i=0; i<volumes.length; i++) {
        for (k=0; k<volumes[i][j]; k++) {
          outputs.push({
            recID: recIDs[i][j][k], 
            timeSlot: j, 
            y: k
          });
        }
      }
    }
  }

  // console.log(outputs);
  return outputs;
}

function cube(filename) {
  this.cc = new catalogCube.catalogCube();
  this.cc.loadRASLog("raslog");
  this.fullResult = this.query({});
}

cube.prototype.query = function(q0) {
  q = translateQuery(q0);
  q.nthreads = 1;
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
