var query = {
  LOD: 2, // TODO
  top: 5,
  // volumeBy: "category",
  T0: 1420070400000, // 2015-01-01
  T1: 1451520000000, // 2015-12-31
  t0: 1420070400000, // 2015-01-01
  t1: 1451520000000, // 2015-12-31
  tg: 27587368 // (t1 - t0) / width_of_time_chart // aggregation resolution
};
var severityChart, componentChart, categoryChart, locationTypeChart, controlActionChart, timeVolumeChart;
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

$(function() {
  $("#tabs").tabs();
  $(document).tooltip({
    content: function() {
      return $(this).attr("title");
    }
  });
  init();

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
        {L: 0, T: 25, W: 120, H: 100});
    controlActionChart = new barChart(
        "controlAction", "#controlActionChart", histogramToArray(d.controlAction), controlActions,
        {L: 0, T: 125, W: 120, H: 190});
    componentChart = new barChart(
        "component", "#componentChart", histogramToArray(d.component), components,
        {L: 120, T: 25, W: 120, H: 290});
    categoryChart = new barChart(
        "category", "#categoryChart", histogramToArray(d.category), categories,
        {L: 0, T: 315, W: 120, H: 290});
    locationTypeChart = new barChart(
        "locationType", "#locationTypeChart", histogramToArray(d.locationType), locationTypes,
        {L: 120, T: 315, W: 120, H: 290});

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

    machineView = new machineView();
    machineView.updateData(d.location, histogramToArray(d.location));
    $("#controlPanel").css("display", "block");
    $("#tableView").css("display", "block");
    $("#cobaltTableView").css("display", "block");
    $("#tabs").css("display", "block");
  
    torusView = new torusView("#tabs-0", {L: 0, T: 0, W: 360, H: 360});

    updateQueryInfo(d);
  });

  refreshCobaltLog({
    minRunTimeSeconds: 55174,
    T0: query.T0, 
    T1: query.T1
  });
  
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
    
    // console.log(query);
    // console.log(d);
    severityChart.updateData(histogramToArray(d.severity));
    controlActionChart.updateData(histogramToArray(d.controlAction));
    componentChart.updateData(histogramToArray(d.component));
    categoryChart.updateData(histogramToArray(d.category));
    locationTypeChart.updateData(histogramToArray(d.locationType));
    timeVolumeChart.updateVolume(d.timeVolumes);
    timeVolumeChart.updateOverviewVolume(d.overviewVolume);
    machineView.updateData(d.location, histogramToArray(d.location));

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
      d.queuedTimestamp = new Date(d.queuedTimestamp);
      d.startTimestamp = new Date(d.startTimestamp);
      d.endTimestamp = new Date(d.endTimestamp);
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
  tr.append("td").html(function(d) {return d.startTimestamp;});
  tr.append("td").html(function(d) {return d.endTimestamp;});
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
    tr.append("td").html(function(d) {return d.jobID;});
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
