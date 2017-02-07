var query = {
  LOD: 2, // TODO
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

var torusRMNJMap = new function() {
  var torusMap = {};
  var RMNJMap = {};

  d3.csv("/torusRMNJ.csv", function(err, data) {
    data.forEach(function(d) {
      torusMap[d.torus] = d.RMNJ;
      RMNJMap[d.RMNJ] = d.torus;
    });
  });

  this.torus = function(RMNJ) {
    return RMNJMap[RMNJ];
  }
  
  this.RMNJ = function(torus) {
    return torusMap[torus];
  }
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
    return; // TODO
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
  d3.json("/cube?query=" + JSON.stringify(query), function (d) {
    if (d == null || d == undefined) return;
    if ("top" in d) refreshTops(d["top"]);

    severityChart = new barChart(
        "severity", "#severityChart", histogramToArray(d.severity), severities,
        {L: 0, T: 25, W: 120, H: 90});
    maintenanceChart = new barChart(
        "maintenance", "#maintenanceChart", histogramToArray(d.maintenance), maintenanceStates,
        {L: 0, T: 115, W: 120, H: 65});
    controlActionChart = new barChart(
        "controlAction", "#controlActionChart", histogramToArray(d.controlAction), controlActions,
        {L: 0, T: 180, W: 120, H: 135});
    componentChart = new barChart(
        "component", "#componentChart", histogramToArray(d.component), components,
        {L: 120, T: 25, W: 120, H: 290});
    categoryChart = new barChart(
        "category", "#categoryChart", histogramToArray(d.category), categories,
        {L: 0, T: 315, W: 120, H: 290});
    locationTypeChart = new barChart(
        "locationType", "#locationTypeChart", histogramToArray(d.locationType), locationTypes,
        {L: 120, T: 315, W: 120, H: 290});
    treeMapView = new treeMapView(
        "#messageIdChart");

    const timeVolumeChartHeight = 300;
    const geom = {L: 240, T: 330, W: 720, H: 300};
    /* const geom = {
      L: 0, 
      T: window.innerHeight - timeVolumeChartHeight,
      W: window.innerWidth, 
      H: timeVolumeChartHeight
    }; */
    timeVolumeChart = new timeVolumeChart(geom);
    timeVolumeChart.updateVolume(d.timeVolumes);
    timeVolumeChart.updateOverviewVolume(d.overviewVolume);
    timeVolumeChart.updateMidplaneVolumes(d.midplaneVolumes);
    
    machineView = new machineView();
    machineView.updateData(d.location, histogramToArray(d.location));
    $("#controlPanel").css("display", "block");
    $("#tableView").css("display", "block");
    $("#cobaltTableView").css("display", "block");
    $("#tabs").css("display", "block");
  
    torusView = new torusView("#tabs-0", {L: 0, T: 0, W: 360, H: 360});
    
    treeMapView.resize({L: 0, T: 605, W: 240, H: 140});
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

  $("#volumeBy").change(function() {
    query.volumeBy = $(this).val();
    $(this).blur();
    refresh();
  })
  $("#toggleLogScale").on("click", toggleLogScale); 

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
  d3.json("/cube?query=" + JSON.stringify(query), function (d) {
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
    tr.append("td").html(function(d) {return torusRMNJMap.torus(d.location);}); 
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
  $(".ui-tooltip").remove();
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
    this.matched = 0;
    this.queryTime = 0;
    this.showJobs = true;
    this.showHeatMap = true;
  };
  var gui = new dat.GUI();
  
  var f1 = gui.addFolder("options");
  f1.add(text, "scale", ["auto", "log", "linear"]).onChange(function(val) {
    console.log(val);
  });
  f1.add(text, "volumeBy", ["all", "severity", "component", "category", "locationType"]).onChange(function(val) {
    console.log(val);
  });
  f1.add(text, "showJobs").onChange(function(val) {
    timeVolumeChart.toggleJobs(val);
  });
  f1.add(text, "showHeatMap").onChange(function(val) {
    timeVolumeChart.toggleHeatMap(val);
  });
  f1.open();

  /*
  var f2 = gui.addFolder("stats");
  f2.add(text, "matched");
  f2.add(text, "queryTime");
  f2.open();*/
}
