var query = {
  LOD: 1, // TODO
  top: 5,
  // volumeBy: "category",
  T0: 1420070400000, // 2015-01-01
  T1: 1451520000000, // 2015-12-31
  t0: 1420070400000, // 2015-01-01
  t1: 1451520000000, // 2015-12-31
  tg: 95301818 // (t1 - t0) / width_of_time_chart // aggregation resolution
};

var severityChart, componentChart, categoryChart, locationTypeChart, maintenanceChart,
    controlActionChart, timeVolumeChart, treeMapView;
var machineView;

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

function graphTraverse(graph, seed, maxDepth) { // WIP
  const directions = ["Ar", "At", "Br", "Bt", "Cr", "Ct", "Dr", "Dt", "Er", "Et"];
  var Q = [];
  var visited = new Set();

  var results;
}

function buildMessageIdHierarchy(volumeBy, msgHistogram) { // volumeBy = component/category/severity (locationType will be in future)
  var hierarchy = {name: "root", children: [], nnodes: 0};

  if (volumeBy == "" || volumeBy == null || volumeBy == undefined) {
    for (var msgID in msgHistogram) {
      hierarchy.children.push({name: msgID, count: msgHistogram[msgID]});
      hierarchy.nnodes ++;
    }
  } else {
    var histogram = {};
    for (var msgID in msgHistogram) {
      var key = events[msgID][volumeBy];
      if (!(key in histogram)) histogram[key] = [];
      histogram[key].push({name: msgID, count: msgHistogram[msgID]});
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

      severityChart = new barChart(
          "severity", "#severityChart", histogramToArray(d.severity), severities,
          {L: 0, T: 0, W: 120, H: 90});
      maintenanceChart = new barChart(
          "maintenance", "#maintenanceChart", histogramToArray(d.maintenance), maintenanceStates,
          {L: 0, T: 90, W: 120, H: 65});
      controlActionChart = new barChart(
          "controlAction", "#controlActionChart", histogramToArray(d.controlAction), controlActions,
          {L: 0, T: 155, W: 120, H: 135});
      componentChart = new barChart(
          "component", "#componentChart", histogramToArray(d.component), components,
          {L: 120, T: 0, W: 120, H: 290});
      categoryChart = new barChart(
          "category", "#categoryChart", histogramToArray(d.category), categories,
          {L: 0, T: 290, W: 120, H: 290});
      locationTypeChart = new barChart(
          "locationType", "#locationTypeChart", histogramToArray(d.locationType), locationTypes,
          {L: 120, T: 290, W: 120, H: 290});
      treeMapView = new treeMapView(
          "#messageIdChart");

      timeVolumeChart = new timeVolumeChart("#timeVolumeChart");
      timeVolumeChart.resize({left: 240, top: 315, width: 720, height: 300});
      timeVolumeChart.updateVolume(d.timeVolumes);
      timeVolumeChart.updateOverviewVolume(d.overviewVolume);
      timeVolumeChart.updateMidplaneVolumes(d.midplaneVolumes);
      timeVolumeChart.updateArcDiagram(d.arcs);
      
      machineView = new machineView("#machineView");
      machineView.resize({left: 270, top: 5, width: 725, height: 306});
      machineView.updateData(d.location, histogramToArray(d.location));
      $("#controlPanel").css("display", "block");
      $("#cobaltTableView").css("display", "block");
      $("#tabs").css("display", "block");
    
      torusView = new torusView("#tabs-0", {L: 0, T: 0, W: 360, H: 360});
      
      treeMapView.resize({L: 0, T: 580, W: 240, H: 140});
      treeMapView.updateData(buildMessageIdHierarchy(query.volumeBy, d.msgID));

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

  adaptGranularity();
  
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
      timeVolumeChart.updateVolume(d.timeVolumes);
      timeVolumeChart.updateOverviewVolume(d.overviewVolume);
      timeVolumeChart.updateMidplaneVolumes(d.midplaneVolumes);
      timeVolumeChart.updateArcDiagram(d.arcs);
      machineView.updateData(d.location, histogramToArray(d.location));
      
      treeMapView.updateData(buildMessageIdHierarchy(query.volumeBy, d.msgID));
      
      updateQueryInfo(d);
    });
}

function toggleLogScale() {
  // machineView.toggleLogScale();
  timeVolumeChart.toggleLogScale();
  severityChart.toggleLogScale();
  componentChart.toggleLogScale();
  categoryChart.toggleLogScale();
  locationTypeChart.toggleLogScale();
  controlActionChart.toggleLogScale();
}

function updateQueryInfo(d) {
  formatInt = d3.format(",");
  formatFloat = d3.format(".3f");
  $("#eventCount").html(formatInt(d.nMatched));
  $("#executionTime").html(formatFloat(d.queryTime) + " sec");
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
      d.queuedTime = new Date(d.queuedTime);
      d.startTime = new Date(d.startTime);
      d.endTime = new Date(d.endTime);
      d.components = partitionParser.components(d.machinePartition);
      d.contour = partitionParser.contour(d.machinePartition);
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

function globalCategoryColor(volumeBy, d) {
  var color = d3.scale.category20();
  if (volumeBy == "severity") {
    switch (d) {
      case "FATAL": return "red";
      case "WARN": return "yellow";
      default: return "green";
    }
  } else {
    return color(d);
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
    this.scale = "auto";
    this.volumeBy = "all";
    this.LOD = "auto";
    this.matched = 0;
    this.queryTime = 0;
    this.showJobs = true;
    this.showHeatMap = true;
    this.showArcs = true;
    this.showTable = false;
    this.brush = false;
  };
  var gui = new dat.GUI();
  
  var f1 = gui.addFolder("options");
  f1.add(text, "volumeBy", ["all", "severity", "component", "category", "locationType"]).onChange(function(val) {
    query.volumeBy = val;
    refresh();
  });
  f1.add(text, "scale", ["auto", "log", "linear"]).onChange(function(val) {
    toggleLogScale(); // FIXME
  });
  f1.add(text, "LOD", ["auto", "0", "1", "2", "3"]).onChange(function(val) {
    if (val == "auto") {
      machineView.toggleAutoLOD(true);
    } else {
      machineView.toggleAutoLOD(false);
      machineView.setLOD(+val);
    }
  });
  f1.add(text, "showJobs").onChange(function(val) {
    timeVolumeChart.toggleJobs(val);
  });
  f1.add(text, "showHeatMap").onChange(function(val) {
    timeVolumeChart.toggleHeatMap(val);
  });
  f1.add(text, "showArcs").onChange(function(val) {
    if (val) $("#arcDiagram").css("display", "block");
    else $("#arcDiagram").css("display", "none");
  });
  f1.add(text, "showTable").onChange(function(val) {
    if (val) $("#tableView").css("display", "block");
    else $("#tableView").css("display", "none");
  });
  f1.add(text, "brush").onChange(function(val) {
    machineView.toggleBrush(val);
    timeVolumeChart.toggleBrush(val);
  });
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
