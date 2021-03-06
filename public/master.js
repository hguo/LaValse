var query = {
  LOD: 1, // TODO
  top: 5,
  volumeBy: "severity",
  T0: 1364774400000, // 2013-01-01
  T1: 1493596800000, // 2017-05-01
  t0: 1364774400000, // 2013-01-01
  t1: 1493596800000, // 2017-05-01
  tg: (1493596800000 - 1364774400000) / 660 * 4
  /*
  T0: 1420070400000, // 2015-01-01
  T1: 1451520000000, // 2015-12-31
  t0: 1420070400000, // 2015-01-01
  t1: 1451520000000, // 2015-12-31
  tg: (1451520000000 - 1420070400000) / 660 * 4
  */
  // 95301818 // (t1 - t0) / width_of_time_chart // aggregation resolution
};

var severityChart, componentChart, categoryChart, locationTypeChart, maintenanceChart,
    controlActionChart, timeVolumeChart, treeMapView;
var machineView;
var matrixChart, mdsView;
var probeLayers = 2;

// init mira partition parser
d3.csv("/partitionInfo.csv", function(err, data) {
  partitionParser.init(data);
});

var userProfileMap = new function() {
  var userMap = {};
  this.map = function(d) {return userMap[d];}
  this.map2 = function(d) {
    var p = userMap[d];
    if (p.color.length>0) {
      return '<span class="userProfile" style="background-color:' + p.color + '">' + p.emoji + '</span>';
    } else {
      return "<span class='userProfile'>" + p.emoji + "</span>";
    }
  }
  
  d3.csv("/userProfiles.csv", function(err, data) {
    data.forEach(function(d) {
      userMap[d.user] = {
        color: d.color, 
        emoji: d.emoji
      };
    });
  });
};

var projProfileMap = new function() {
  var projMap = {};
  this.map = function(d) {return projMap[d];}
  this.map2 = function(d) {
    var p = projMap[d];
    if (p.color.length>0) {
      return '<span class="projProfile" style="background-color:' + p.color + '">' + p.emoji + '</span>';
    } else {
      return "<span class='projProfile'>" + p.emoji + "</span>";
    }
  }
  
  d3.csv("/projProfiles.csv", function(err, data) {
    data.forEach(function(d) {
      projMap[d.proj] = {
        color: d.color, 
        emoji: d.emoji
      };
    });
  });
};

var graphRM = {}, graphRMN = {}, graphRMNJ = {};
RMNJTorusMap = {};

d3.csv("/graphRM.csv", function(err, data) {
  data.forEach(function(d) {
    graphRM[d.RM] = d;
  });
});

d3.csv("/graphRMN.csv", function(err, data) {
  data.forEach(function(d) {
    graphRMN[d.RMN] = d;
  });
});

d3.csv("/graphRMNJ.csv", function(err, data) {
  data.forEach(function(d) {
    graphRMNJ[d.RMNJ] = d;
  });
});

function graphTraverse(graph, root, maxDepth) { // WIP
  const directions = ["Ar", "At", "Br", "Bt", "Cr", "Ct", "Dr", "Dt", "Er", "Et", "IO"];
  var Q = [];
  var visited = new Set();
  var output = []; // {id, depth}

  Q.push({id: root, depth: 0, parent: undefined, parentEdge: undefined});
  while (Q.length > 0) {
    var current = Q[0]; Q.shift(); // pop
    var currentNode = graph[current.id];
    var currentDepth = current.depth;
    
    visited.add(current.id);
    output.push(current);

    if (currentDepth < maxDepth && currentNode != undefined) {
      directions.forEach(function(dir) {
        if (dir in currentNode) {
          var neighborId = currentNode[dir];
          if (!visited.has(neighborId)) 
            Q.push({
              id: neighborId, 
              depth: currentDepth+1, 
              parent: current.id, 
              parentEdge: dir
            });
        }
      });
    }
  }

  return output;
}

function buildMessageIdHierarchy(volumeBy, msgHistogram) { // volumeBy = component/category/severity (locationType will be in future)
  var hierarchy = {name: "root", children: [], nnodes: 0};

  if (volumeBy == "" || volumeBy == null || volumeBy == undefined) {
    for (var msgID in msgHistogram) {
      hierarchy.children.push({name: msgID, count: msgHistogram[msgID], area: quantizedFreq(msgHistogram[msgID])});
      hierarchy.nnodes ++;
    }
  } else {
    var histogram = {};
    for (var msgID in msgHistogram) {
      var key = events[msgID][volumeBy];
      if (!(key in histogram)) histogram[key] = [];
      histogram[key].push({name: msgID, count: msgHistogram[msgID], area: quantizedFreq(msgHistogram[msgID])});
      hierarchy.nnodes ++;
    }

    for (var key in histogram) {
      hierarchy.children.push({name: key, children: histogram[key]});
    }
  }

  return hierarchy;
}

$(function() {
  $("#tabs").tabs();
  $(document).tooltip({
    track: true,
    show: {delay: 100, duration: 800},
    content: function() {
      return $(this).attr("title");
    }
  });
  init();
  initControlPanel();

  window.addEventListener("resize", function() {
    return;
    const timeVolumeChartHeight = 300;
    timeVolumeChart.resize({
      L: 0, 
      T: window.innerHeight - timeVolumeChartHeight,
      W: window.innerWidth, 
      H: timeVolumeChartHeight
    });
  });
});

function init() {
  d3.json("/cube_post")
    .header("Content-Type", "application/json")
    .post(JSON.stringify(query), function (err, d) {
      if (d == null || d == undefined) return;
      if ("top" in d) refreshTops(d["top"]);

      severityChart = new barChart("severity", "#severityChart", Object.keys(d.severity), severities);
      maintenanceChart = new barChart("maintenance", "#maintenanceChart", Object.keys(d.maintenance), maintenanceStates);
      controlActionChart = new barChart("controlAction", "#controlActionChart", Object.keys(d.controlAction), controlActions);
      componentChart = new barChart("component", "#componentChart", Object.keys(d.component), components);
      categoryChart = new barChart("category", "#categoryChart", Object.keys(d.category), categories);
      locationTypeChart = new barChart("locationType", "#locationTypeChart", Object.keys(d.locationType), locationTypes);
      matrixChart = new matrixChart();
      // graphView = new graphView();
      mdsView = new mdsView();

      severityChart.resize({L: 0, T: 0, W: 120, H: 90});
      maintenanceChart.resize({L: 0, T: 90, W: 120, H: 65});
      controlActionChart.resize({L: 0, T: 155, W: 120, H: 135});
      componentChart.resize({L: 120, T: 0, W: 120, H: 290});
      categoryChart.resize({L: 0, T: 290, W: 120, H: 290});
      locationTypeChart.resize({L: 120, T: 290, W: 120, H: 290});
      matrixChart.resize({L: 960, T: 0, W: 200, H: 200});

      severityChart.updateData(histogramToArray(d.severity));
      maintenanceChart.updateData(histogramToArray(d.maintenance));
      controlActionChart.updateData(histogramToArray(d.controlAction));
      componentChart.updateData(histogramToArray(d.component));
      categoryChart.updateData(histogramToArray(d.category));
      locationTypeChart.updateData(histogramToArray(d.locationType));
      matrixChart.updateData(d.msgIdVolumes);
      
      treeMapView = new treeMapView(
          "#messageIdChart");

      timeVolumeChart = new timeVolumeChart("#timeVolumeChart");
      timeVolumeChart.resize({left: 240, top: 330, width: 720, height: 300});
      timeVolumeChart.updateVolume(d.severityVolumes); // TODO
      // timeVolumeChart.updateOverviewVolume(d.overviewVolume);
      timeVolumeChart.updateMidplaneVolumes(d.midplaneVolumes);
      timeVolumeChart.updateArcDiagram(d.msgIdVolumes);
      
      machineView = new machineView("#machineView");
      machineView.resize({left: 270, top: 25, width: 725, height: 300});
      machineView.updateData(d.location, histogramToArray(d.location));
      $("#controlPanel").css("display", "block");
      $("#cobaltTableView").css("display", "block");
      // $("#tabs").css("display", "block");
    
      torusView = new torusView("#torusView", {L: 960, T: 400, W: 200, H: 200});
      
      treeMapView.resize({L: 0, T: 580, W: 240, H: 140});
      treeMapView.updateData(d.msgID, buildMessageIdHierarchy(query.volumeBy, d.msgID));

      updateQueryInfo(d);

      // load maintenance time
      d3.csv("/maintenance.csv", function(data) {
        data.forEach(function(d) {
          d.startTime = new Date(d.startTime);
          d.endTime = new Date(d.endTime);
        });
        timeVolumeChart.updateMaintenanceData(data);
      });
    });

  refreshCobaltLog({T0: query.T0, T1: query.T1});

  var defaultQuery = Object.assign({}, query);
  $("#reset").on("click", function() {
    query = Object.assign({}, defaultQuery);
    timeVolumeChart.reset();
    severityChart.reset();
    maintenanceChart.reset();
    componentChart.reset();
    categoryChart.reset();
    locationTypeChart.reset();
    timeVolumeChart.reset();
    machineView.reset();
    refresh();
  });
}

function refresh() {
  // d3.json("/cube?query=" + JSON.stringify(query), function (d) {
 
  function adaptGranularity() {
    const minUnitWidth = 5; // 5 pixels
    const width = 660; // width of the timeline
    const duration = query.t1 - query.t0;
    const granularities = [
      1,        // millisecond
      10,       // 10 milliseconds
      100,      // 100 milliseconds
      1000,     // second
      10000,    // 10 seconds
      60000,    // minute
      600000,   // 10 minutes
      3600000,  // hour
      7200000,  // 2 hours
      21600000,  // 6 hours
      86400000  // day
    ];

    var targetNumberOfSlots = Math.floor(width/minUnitWidth);
    var targetGranularity = granularities[granularities.length-1];
    for (var i=0; i<granularities.length; i++) {
      if (duration / granularities[i] <= targetNumberOfSlots) {
        targetGranularity = granularities[i];
        break;
      }
    }

    query.t0 = Math.floor(query.t0 / targetGranularity) * targetGranularity;
    query.t1 = Math.ceil(query.t1 / targetGranularity) * targetGranularity;
    query.tg = targetGranularity;
    console.log(duration / targetGranularity);
    // console.log(query.t0, query.t1, duration, query.tg, duration/query.tg);
  }

  // adaptGranularity();
  
  d3.json("/cube_post")
    .header("Content-Type", "application/json")
    .post(JSON.stringify(query), function (err, d) {
      removeTooltips();
    
      if ("top" in d) refreshTops(d["top"]);
      if ("recIDs" in d) refreshRecIDs(d["recIDs"]);

      severityChart.updateData(histogramToArray(d.severity));
      maintenanceChart.updateData(histogramToArray(d.maintenance));
      controlActionChart.updateData(histogramToArray(d.controlAction));
      componentChart.updateData(histogramToArray(d.component));
      categoryChart.updateData(histogramToArray(d.category));
      locationTypeChart.updateData(histogramToArray(d.locationType));
      switch (query.volumeBy) {
        case "component": timeVolumeChart.updateVolume(d.componentVolumes); break;
        case "category": timeVolumeChart.updateVolume(d.categoryVolumes); break;
        case "locationType": timeVolumeChart.updateVolume(d.locationTypeVolumes); break;
        default: timeVolumeChart.updateVolume(d.severityVolumes); break;
      }
      // timeVolumeChart.updateOverviewVolume(d.overviewVolume);
      timeVolumeChart.updateMidplaneVolumes(d.midplaneVolumes);
      timeVolumeChart.updateArcDiagram(d.msgIdVolumes);
      machineView.updateData(d.location, histogramToArray(d.location));
      
      treeMapView.updateData(d.msgID, buildMessageIdHierarchy(query.volumeBy, d.msgID));
      matrixChart.updateData(d.msgIdVolumes);
      
      updateQueryInfo(d);
    });
}

function toggleLogScale() {
  // machineView.toggleLogScale();
  timeVolumeChart.toggleLogScale();
}

function updateQueryInfo(d) {
  formatInt = d3.format(",");
  formatFloat = d3.format(".3f");
  d3.select("#executionSummary")
    .text("matched: " + formatInt(d.nMatched) + " | execTime: " + formatFloat(d.queryTime) + " sec");
  $("#eventCount").html(formatInt(d.nMatched));
  $("#executionTime").html();
}

function refreshRecIDs(data) {
  if (data.length == 0) {
    timeVolumeChart.updateRecords([]);
    return;
  } else {
    var query = [];
    data.forEach(function(d) {query.push(d.recID);});

    d3.json("/ras?query=" + JSON.stringify(query), function(data1) {
      for (var i=0; i<data1.length; i++) {
        data1[i].eventTime = new Date(data1[i].eventTime);
        data1[i].y = data[i].y;
      }
      removeTooltips();
      timeVolumeChart.updateRecords(data1);
    });
  }
}

function refreshCobaltLog(q) {
  d3.json("/cobalt?query=" + JSON.stringify(q), function(data) {
    data.forEach(function(d) {
      d.queuedTime = new Date(d.queuedTimestamp);
      d.startTime = new Date(d.startTimestamp);
      d.endTime = new Date(d.endTimestamp);
      d.components = partitionParser.components(d.partition);
      d.contour = partitionParser.contour(d.partition);
    });
    timeVolumeChart.updateCobaltData(data);
    updateCobaltTable(data);
  });
}

function updateCobaltTable(allData) {
  var data = allData.slice(0, 5);
  // var data = allData;

  var tbody = d3.select("#cobaltTable tbody");
  tbody.selectAll("tr").remove();
  var tr = tbody.selectAll("tr").data(data)
    .enter().append("tr");

  tr.append("td").html(function(d) {return d._id;});
  tr.append("td").html(function(d) {return d.startTime;});
  tr.append("td").html(function(d) {return d.endTime;});
  tr.append("td").html(function(d) {return d.runTimeSeconds;});
  tr.append("td").html(function(d) {return d.mode;});
  tr.append("td").html(function(d) {return d.machinePartition;});
  tr.append("td").html(function(d) {return d.exitCode;});
  tr.append("td").html(function(d) {return d.projectName;});
  tr.append("td").html(function(d) {return d.cobaltUserName;});
}

function refreshTops(q) {
  d3.json("/ras?query=" + JSON.stringify(q), function(dataAll) {
    var data = dataAll.slice(0, 4);
    var tbody = d3.select("#eventTable tbody");
    tbody.selectAll("tr").remove();
    var tr = tbody.selectAll("tr").data(data)
      .enter().append("tr");

    tr.append("td").html(function(d) {return d._id;});
    tr.append("td").html(function(d) {return d.eventTime;});
    tr.append("td").html(function(d) {return d.messageID + " (" + events[d.messageID].severity[0] + ")";})
      .attr("title", function(d) {
        return "<b>messageID:</b> " + d.messageID
          + "<br><b>severity:</b> " + events[d.messageID].severity
          + "<br><b>description:</b> " + events[d.messageID].description
          + "<br><b>controlActions:</b> " + String(events[d.messageID].controlAction).replace(/,/g, ', ')
          + "<br><b>serviceAction:</b> " + events[d.messageID].serviceAction
          + "<br><b>relevantDiagnosticSuites:</b> " + String(events[d.messageID].relevantDiagnosticSuites).replace(/,/g, ', ');
      });
    tr.append("td").html(function(d) {return events[d.messageID].component;})
      .attr("title", function(d) {
        return components[events[d.messageID].component];
      });
    tr.append("td").html(function(d) {return events[d.messageID].category;})
      .attr("title", function(d) {
        return categories[events[d.messageID].category];
      });
    tr.append("td").html(function(d) {return d.cobaltJobID;});
    tr.append("td").html(function(d) {return d.location;})
      .attr("title", function(d) {
        L = parseLocation(d.location);
        return "<b>location:</b> " + L.str
          + "<br><b>type:</b> " + locationTypes[L.type]; 
      });
    tr.append("td").html(function(d) {if (d.location in graphRMNJ) return graphRMNJ[d.location].coords;});
    tr.append("td").html(function(d) {return d.CPU;});
    tr.append("td").html(function(d) {return d.block;})
      .attr("title", function(d) {return d.block;});
    tr.append("td").html(function(d) {return d.message;})
      .attr("title", function(d) {return d.message;});
  });
}

function histogramToArray(r) {
  var array = []; 
  for (var key in r) {
    array.push({
      k: key, 
      v: r[key]
    });
  }
  return array;
}
  
var formatPower = function(d) {
  var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  return (d + "").split("").map(function(c) { return superscript[c]; }).join(""); 
  // var format = d3.format(".2s");
  // return format(d);
};

function ceilPow(v) {
  return Math.pow(10, Math.ceil(Math.log10(v)));
}

function removeTooltips() {
  $(".ui-tooltip")
    .not(".customTooltip")
    .remove();
}

function globalCategoryColor4MsgId(volumeBy, d) {
  var e = events[d];
  if (volumeBy === "severity") return globalCategoryColor(volumeBy, e.severity);
  else if (volumeBy === "component") return globalCategoryColor(volumeBy, e.component);
  else if (volumeBy === "category") return globalCategoryColor(volumeBy, e.category);
  else return globalCategoryColor(volumeBy, d);
}

function globalCategoryColor(volumeBy, d) {
  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var domain = [];
  for (var i=0; i<20; i++) domain.push(i);
  color.domain(domain);

  if (volumeBy == undefined || volumeBy == "all") 
    return "steelblue";
  else if (volumeBy == "severity") {
    switch (d) {
      case 2: case "FATAL": return "#d7191c";
      case 1: case "WARN": return "#fdae61";
      default: return "#2c7bb6";
    }
  } else {
    if (isNaN(d)) return color(hash(d)%20);
    return color(d);
  }

  function hash(str) {
    var h = 0;
    if (str.length === 0) return h;
    for (var i=0; i<str.length; i++) {
      var chr = str.charCodeAt(i);
      h = ((h << 5) - h) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return h;
  }
}

function adjustCanvasResolution(canvas, ctx) {
  var devicePixelRatio = window.devicePixelRatio || 1, 
      backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                          ctx.mozBackingStorePixelRatio ||
                          ctx.msBackingStorePixelRatio ||
                          ctx.oBackingStorePixelRatio ||
                          ctx.backingStorePixelRatio || 1;

  var ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    ctx.scale(ratio, ratio);
  }
}

function initControlPanel() {
  var text = new function() {
    this.reset = function () {
    };
    // this.scale = "auto";
    this.volumeBy = "severity";
    this.LOD = "auto";
    this.matched = 0;
    this.queryTime = 0;
    this.showJobs = true;
    this.showHeatMap = true;
    this.showArcs = true;
    this.showTable = false;
    this.showTooltip = true;
    this.brush = function() {
      machineView.toggleBrush(true);
      timeVolumeChart.toggleBrush(true);
    }
    this.themeRiver = false;
    this.probeLayers = 2;
  };
  var gui = new dat.GUI();
  
  var f1 = gui.addFolder("options");
  f1.add(text, "volumeBy", ["all", "severity", "component", "category", "locationType"]).onChange(function(val) {
    query.volumeBy = val;
    refresh();
  });
  // f1.add(text, "scale", ["auto", "log", "linear"]).onChange(function(val) {
  //   toggleLogScale(); // FIXME
  // });
  f1.add(text, "LOD", ["auto", "0", "1", "2", "3"]).onChange(function(val) {
    if (val == "auto") {
      machineView.toggleAutoLOD(true);
    } else {
      machineView.toggleAutoLOD(false);
      machineView.setLOD(+val);
    }
  });
  f1.add(text, "probeLayers", [0, 1, 2, 3, 4, 5]).onChange(function(val) {
    probeLayers = val;
  });
  f1.add(text, "showJobs").onChange(function(val) {
    timeVolumeChart.toggleJobs(val);
  });
  f1.add(text, "showHeatMap").onChange(function(val) {
    timeVolumeChart.toggleHeatMap(val);
  });
  f1.add(text, "themeRiver").onChange(function(val) {
    timeVolumeChart.toggleThemeRiver(val);
  });
  f1.add(text, "showArcs").onChange(function(val) {
    if (val) $("#arcDiagram").css("display", "block");
    else $("#arcDiagram").css("display", "none");
  });
  f1.add(text, "showTooltip").onChange(function(val) {
    if (val) {
      $(document).tooltip("enable");
    } else {
      $(document).tooltip("disable");
    }
  });
  f1.add(text, "showTable").onChange(function(val) {
    if (val) $("#tableView").css("display", "block");
    else $("#tableView").css("display", "none");
  });
  f1.add(text, "brush"); 
  f1.open();

  /*
  var f2 = gui.addFolder("stats");
  f2.add(text, "matched");
  f2.add(text, "queryTime");
  f2.open();*/
}

function frequencyColorMap(val) {
  if (val == 0) return "#ffffff";
  else if (val == 1) return "#d0d1e6";
  else if (val < 10) return "#a6bddb";
  else if (val < 100) return "#74a9cf";
  else if (val < 1000) return "#3690c0";
  else if (val < 10000) return "#0570b0";
  else if (val < 100000) return "#045a8d";
  else return "#023858";
}

function frequencyColorMap1(val) {
  if (val == 0) return "#ffffff";
  else if (val == 1) return "#fee391";
  else if (val < 10) return "#fec44f";
  else if (val < 100) return "#fe9929";
  else if (val < 1000) return "#ec7014";
  else if (val < 10000) return "#cc4c02";
  else if (val < 100000) return "#993404";
  else return "#662506";
}

function frequencyColorMap2(val) {
  if (val == 0) return "#ffffff";
  else if (val == 1) return "#c6dbef";
  else if (val < 10) return "#9ecae1";
  else if (val < 100) return "#6baed6";
  else if (val < 1000) return "#4292c6";
  else return "#2171b5";
}

function frequencyColorMap2bw(val) {
  if (val == 0) return "#ffffff";
  else if (val == 1) return "#d9d9d9";
  else if (val < 10) return "#bdbdbd";
  else if (val < 100) return "#969696";
  else if (val < 1000) return "#737373";
  else return "#525252";
}

function warpedFreq(v) {
  if (v == 0) return 0;
  else return 1 + Math.log10(v);
}

function quantizedFreq(v) {
  if (v == 0) return 0;
  else if (v == 1) return 1;
  else if (v > 1 && v < 10) return 2;
  else if (v > 10 && v < 100) return 3;
  else if (v > 100 && v < 1000) return 4;
  else if (v > 1000 && v < 10000) return 5;
  else if (v > 10000 && v < 100000) return 6;
  else if (v > 100000 && v < 1000000) return 7;
  else return 8;
}

d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

