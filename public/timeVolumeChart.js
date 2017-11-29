function timeVolumeChart(id) {
  const margin = {top: 0, right: 10, bottom: 20, left: 50};
  const O0 = 1420070400000, // 2015-01-01
        Og = 86400000; // milliseconds in a day

  var width, height; 
  var cobaltTop, volumeTop, overviewTop;
  var cobaltWidth, volumeWidth, overviewWidth;
  var cobaltHeight, volumeHeight, overviewHeight;
  var useLogScale = true;
  var toggleJobs = true;
  var toggleHeatMap = true;
  var toggleThemeRiver = false;

  var midplaneVolumes = [];
  var midplaneVolumeMax = 1;

  var arcs = [];
  var arcTooltip = d3.select("body")
    .append("div")
    .attr("id", "arcTooltip")
    .attr("class", "customTooltip ui-tooltip ui-corner-all ui-widget-shadow ui-widget ui-widget-content")
    .style("display", "none");
  
  var cobaltJobHighlighted = false;
  var cobaltYTranslate = 0, cobaltYScale = 1;

  var highlightedArcs = new Set();

  var volumeZoom = d3.zoom()
    .on("zoom", volumeZoomed);

  var cobaltZoom = d3.zoom()
    .on("zoom", cobaltZoomed);

  var cobaltCanvas = d3.select(id)
    .append("canvas")
    .style("position", "absolute");

  var volumeCanvas = d3.select(id)
    .append("canvas")
    .attr("id", "arcDiagram")
    .style("position", "absolute")
    .style("z-index", 3);

  var svg = d3.select(id)
    .append("svg")
    .attr("id", "timeVolumeChartSvg")
    .style("position", "absolute")
    .style("z-index", 1)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var svgCobalt = svg.append("g");
  var svgCobaltContent = svgCobalt.append("g")
    .attr("clip-path", "url(#cobaltMask)");
  var svgVolume = svg.append("g");
  var svgOverview = svg.append("g")
    .attr("display", "none");
 
  var patternDef = d3.select("#timeVolumeChartSvg") // pattern-stripe
    .append("defs");
  patternDef.append("pattern")
    .attr("id", "pattern-stripe")
    .attr("width", 4)
    .attr("height", 4)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(45)")
    .append("rect")
    .attr("width", 2)
    .attr("height", 4)
    .attr("transform", "translate(0,0)")
    .attr("fill", "white");
  patternDef.append("mask")
    .attr("id", "mask-stripe")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "url(#pattern-stripe)");

  svg.append("defs") // masking cobalt
    .append("clipPath")
    .attr("id", "cobaltMask")
    .append("rect")
    .attr("id", "cobaltMaskRect")
    .attr("x", 0)
    .attr("y", 0);

  svgVolume.append("rect")
    .attr("class", "zoom")
    .style("fill", "white")
    .style("opacity", 0);

  svgCobaltContent.append("rect")
    .attr("class", "zoom")
    .style("fill", "white")
    .style("opacity", 0);

  svgVolume.append("text")
    .attr("class", "timeLabelLeft")
    .text(d3.isoFormat(new Date(query.T0)));

  svgVolume.append("text")
    .attr("class", "timeLabelRight")
    .style("text-anchor", "end")
    .text(d3.isoFormat(new Date(query.T1)));

  svgVolume.append("g")
    .attr("class", "cursor")

  var xDomain = [query.T0, query.T1];
  var xDomainPrevious = [query.T0, query.T1];
  var xDomainBeforeCobaltJobHiglighted = [query.T0, query.T1];

  var yMax = 1; 
  yMax = ceilPow(yMax);
  var yDomainLog = [1, yMax],
      yDomainLinear = [0, yMax];

  var x0 = d3.scaleTime()
    .domain(xDomain);
  var x = d3.scaleTime()
    .clamp(true)
    .domain(xDomain);
  var xNoClamp = d3.scaleTime() // used for the arc view
    .clamp(false)
    .domain(xDomain);
  var X0 = d3.scaleTime() // the overview
    .domain(xDomain);
  var X = d3.scaleTime()
    .domain(xDomain)
    .clamp(true);

  var yWarp = d3.scaleLinear()
    .domain([0, 7]);
  var yRiver = d3.scaleLinear();
  var yLog = d3.scaleLog()
    .clamp(true)
    .domain(yDomainLog)
    .nice(4);
  var Y = d3.scaleLinear()
    .domain([0, 7])
    .nice(3);
  var yLinear = d3.scaleLinear() 
    .clamp(true)
    .domain(yDomainLinear)
    .nice(8);
  var yLinearReverse = d3.scaleLinear() 
    .clamp(true)
    .domain([0, 20])
    .nice(8);

  var midplanes = enumerateMidplanes();
  var yCobalt = d3.scaleLinear()
    .domain([0, 96]);
  var yCobalt0 = d3.scaleLinear()
    .domain([0, 96]);

  var xAxis = d3.axisTop().scale(x), 
      // yAxis = d3.axisLeft().scale(yLog).ticks(3)
      yAxis = d3.axisLeft().scale(yWarp).ticks(3)
        .ticks(8)
        .tickFormat(function(d) {
          // return d3.format(".2s")(d);
          if (d == 0) return "0";
          else if (d == 1) return "1";
          else if (d == 4) return "1k";
          else if (d == 7) return "1M";
          else return "";
        });

  var XAxis = d3.axisBottom().scale(X),
      YAxis = d3.axisLeft().scale(Y).ticks(8)
        .tickFormat(function(d) {
          if (d == 0) return "0";
          else if (d == 1) return "1";
          else if (d == 4) return "1k";
          else if (d == 7) return "1M";
          else return "";
        });

  var cobaltAxis = d3.axisLeft()
    .scale(yCobalt)
    .tickFormat(function(d) {
      if (midplanes[d] == undefined) return; 
      else return midplanes[d];
    });

  var lineLog = d3.line() // .curve(d3.curveBasis)
    .x(function(d, i) {return x(query.T0 + query.tg * i);})
    .y(function(d) {return yLog(d);});
  var lineLinear = d3.line() 
    .x(function(d, i) {return x(query.T0 + query.tg * i);})
    .y(function(d) {return yLinear(d);});
  var lineWarp = d3.line()
    .x(function(d, i) {return x(query.T0 + query.tg * i);})
    .y(function(d) {return yWarp(warpedFreq(d));});
    // .curve(d3.curveStep);
    // .curve(d3.curveMonotoneX);

  var overviewLineLog = d3.line()
    .x(function(d, i) {return X(O0 + Og*i);})
    .y(function(d) {return Y(warpedFreq(d));});

  var stack = d3.stack()
    // .offset(d3.stackOffsetWiggle); // for theme river
    .offset(d3.stackOffsetSilhouette); 
  var area = d3.area()
    .x(function(d, i) {return x(query.T0 + query.tg * i);})
    .y0(function(d) { return yRiver(d[0]); })
    .y1(function(d) { return yRiver(d[1]); })
    // .curve(d3.curveStep);
    .curve(d3.curveMonotoneX);

  svgVolume.append("g")
    .attr("class", "axis axis-x");

  svgVolume.append("g")
    .attr("class", "axis axis-y");

  svgOverview.append("g")
    .attr("class", "axis axis-X");

  svgOverview.append("g")
    .attr("class", "axis axis-Y");

  svgCobalt.append("g")
    .attr("class", "axis axis-cobalt");

  var volumeBrush = d3.brushX()
    .on("end", volumeBrushed);
  // svgVolume.append("g")
  //   .attr("id", "volumeBrush")
  //   .attr("class", "brush");

  var overviewBrush = d3.brushX()
    .on("brush end", overviewBrushed);
  svgOverview.append("g")
    .attr("class", "brush")
    .attr("id", "overviewBrush");
  
  var jobTransformX = function(d) {
    var t0 = x(d.startTime), t1 = x(d.endTime);
    var scale = "scale(" + (t1-t0) + ",1)",
        translate = "translate(" + t0 + "px,0px)"
    return translate + scale;
  };
 
  var jobTransform = function(d) {
    var t0 = x(d.startTime), t1 = x(d.endTime);
    var scale = "scale(" + (t1-t0) + "," + cobaltYScale*cobaltHeight/96 + ")"
        translate = "translate(" + t0 + "px," + cobaltYTranslate + "px)";
    return translate + scale;
  };

  this.resize = function(geom) {
    d3.select("#timeVolumeChartSvg")
      .style("top", geom.top)
      .style("left", geom.left)
      .attr("width", geom.width)
      .attr("height", geom.height);

    width = geom.width - margin.left - margin.right,
    height = geom.height - margin.top - margin.bottom;

    // const cobaltRatio = 0.4, volumeRatio = 0.4, overviewRatio = 0.2;
    const cobaltRatio = 0.4, volumeRatio = 0.6, overviewRatio = 0;
    const padding = 35;

    overviewTop = 0;
    cobaltTop = overviewRatio * height;
    volumeTop = (overviewRatio + cobaltRatio) * height + padding;
    
    cobaltWidth = width;
    cobaltHeight = cobaltRatio * height;
    volumeHeight = volumeRatio * height - padding;
    overviewHeight = overviewRatio * height - padding;

    cobaltCanvas
      .style("left", geom.left + margin.left)
      .style("top", geom.top + margin.top + cobaltTop)
      .attr("width", width)
      .attr("height", cobaltHeight);
    var ctx = cobaltCanvas.node().getContext("2d");
    adjustCanvasResolution(cobaltCanvas.node(), ctx);

    volumeCanvas
      .style("left", geom.left + margin.left)
      .style("top", geom.top + volumeTop + volumeHeight)
      .attr("width", width)
      // .attr("height", width/2);
      .attr("height", 120); // FIXME
    var ctx1 = volumeCanvas.node().getContext("2d");
    adjustCanvasResolution(volumeCanvas.node(), ctx1);

    volumeZoom.scaleExtent([1, 10000000000])
      .translateExtent([[0, volumeTop], [width, volumeHeight]])
      .extent([[0, volumeTop], [width, volumeHeight]]);
    svgVolume.call(volumeZoom);

    volumeBrush.extent([[0, 0], [width, volumeHeight]]);
    // svg.select("#volumeBrush")
    //   .call(volumeBrush);

    cobaltZoom.scaleExtent([1, 100])
      .translateExtent([[0, 0], [width, cobaltHeight]])
      .extent([[0, 0], [width, cobaltHeight]]);
    svgCobalt.call(cobaltZoom)
      .on("dblclick.zoom", null);

    svgCobalt.attr("transform", "translate(0," + cobaltTop + ")");
    svgVolume.attr("transform", "translate(0," + volumeTop + ")");
    svgOverview.attr("transform", "translate(0," + overviewTop + ")");

    svg.select("#cobaltMaskRect")
      .attr("width", width)
      .attr("height", cobaltHeight);

    svgVolume.select(".zoom")
      .attr("width", width)
      .attr("height", volumeHeight);

    svgCobaltContent.select(".zoom")
      .attr("width", width)
      .attr("height", cobaltHeight);

    x0.range([0, width]);
    x.range([0, width]);
    xNoClamp.range([0, width]);
    X0.range([0, width]); 
    X.range([0, width]); 

    yLog.rangeRound([volumeHeight, 0]);
    yWarp.rangeRound([volumeHeight, 0]);
    yRiver.rangeRound([volumeHeight, 0]);
    yLinear.rangeRound([volumeHeight, 0]);
    yLinearReverse.rangeRound([0, volumeHeight]);
    Y.rangeRound([overviewHeight, 0]);
    
    yCobalt.range([0, cobaltHeight]);
    yCobalt0.range([0, cobaltHeight]);

    svgVolume.select(".axis-x")
      // .attr("transform", "translate(0," + volumeHeight + ")")
      .call(xAxis);

    svgVolume.select(".axis-y")
      .call(yAxis);

    svgVolume.select(".timeLabelLeft")
      .attr("x", 2)
      .attr("y", -22);

    svgVolume.select(".timeLabelRight")
      .attr("x", width)
      .attr("y", -22);

    svgOverview.select(".axis-X")
      .attr("transform", "translate(0," + overviewHeight + ")")
      .call(XAxis);

    svgOverview.select(".axis-Y")
      .call(YAxis);

    svgCobalt.select(".axis-cobalt")
      .call(cobaltAxis);

    var line = useLogScale ? lineLog : lineLinear;
    svgVolume.selectAll(".line")
      .attr("d", function(d) {return line(d.volumes);});

    /*
    svgOverview.selectAll(".line")
      .attr("d", function(d) {return overviewLineLog(d);});*/

    svgCobaltContent.selectAll(".cobalt")
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".backend")
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".maintenance")
      .style("transform", jobTransform);
  
    /*
    overviewBrush.extent([[0, 0], [width, overviewHeight]]);
    svgOverview.select("#overviewBrush")
      .call(overviewBrush)
      .call(overviewBrush.move, X0.range()); */

    drawMidplaneVolumes();
    drawArcDiagram();
    
  }

  function buildStackData(data) {
    var stackData = [];
    var sums = [];

    const nVolumes = data.length;
    const nTimeSlots = data[0].volumes.length; // number of time slots
    
    var keys = [];
    for (var i=0; i<data.length; i++) keys.push(data[i].key); 
    
    for (var i=0; i<nTimeSlots; i++) {
      var obj = {};
      var sum = 0;
      for (var j=0; j<nVolumes; j++) {
        const key = keys[j];
        // var val = data[j].volumes[i];
        var val = warpedFreq(data[j].volumes[i]);
        // var val = quantizedFreq(data[j].volumes[i]);
        obj[key] = val;
        sum += val;
      }
      stackData.push(obj);
      sums.push(sum);
    }

    return {
      keys: keys, 
      data: stackData,
      max: d3.max(sums, function(d) {return d;})
    };
  }

  function updateSampledRecords(data, stackData, stackedData) {
    var query = [];
    var map = {}; // key: recID

    for (var i=0; i<data.length; i++) {
      for (var j=0; j<data[i].recIDs.length; j++) {
        const count = data[i].volumes[j];
        const count1 = quantizedFreq(data[i].volumes[j]);
        for (var k=0; k<count1; k++) {
          const msgID = data[i].recIDs[j][k];
          var obj = {
            unique: count == count1,
            count: count1,
            riverId: i,
            timeSlot: j,
            k: k
          };

          query.push(msgID);
          map[msgID] = obj;
        }
      }
    }

    d3.json("/ras?query=" + JSON.stringify(query), function(data1) {
      for (var i=0; i<data1.length; i++) {
        var e = data1[i];
        e.eventTime = new Date(e.eventTime);
        e.category = events[e.messageID].category;
        e.locationType = parseLocationType(e.location);

        var obj = map[e._id];
        var y0 = stackedData[obj.riverId][obj.timeSlot][0], 
            y1 = stackedData[obj.riverId][obj.timeSlot][1];
        var dy = (y1 - y0) / (obj.count + 1);
        var y = y0 + (obj.k+1) * dy;

        e.unique = obj.unique;
        e.y = y;
      }
      updateRecords(data1);
    });
  }

  this.updateVolume = function(data) {
    /* 
    yMax = d3.max(data, function(d) {return d3.max(d, function(dd) {return dd;});});
    if (yMax <= 1000 && useLogScale) toggleLogScale();
    if (yMax >= 10000 && !useLogScale) toggleLogScale();
  
    if (useLogScale) yMax = ceilPow(yMax);
    
    yDomainLog = [1, yMax];
    yDomainLinear = [0, yMax];
    yLog.domain(yDomainLog);
    yLinear.domain(yDomainLinear);
    // yWarp.domain([0, d3.max(data, function(d) {return d3.max(d, function(dd) {return quantizedFreq(dd);});})]);
    */

    svgVolume.select(".axis-x")
      .transition()
      .call(xAxis);
    
    svgVolume.select(".axis-y")
      .transition()
      .call(yAxis)
   
    // var line = useLogScale ? lineLog : lineLinear;
    var line = lineWarp;

    svgVolume.selectAll(".line").remove();
    svgVolume.selectAll(".line")
      .data(data)
      .enter()
      .append("path")
      .attr("class", "line")
      .style("fill", "none")
      // .style("stroke", "steelblue")
      .style("stroke", function(d, i) {
        return globalCategoryColor(query.volumeBy, i);
      })
      .attr("d", function(d) {return line(d.volumes);});

    var stackData = buildStackData(data);
    stack.keys(stackData.keys);
    var stackedData = stack(stackData.data);
    
    setTimeout(updateSampledRecords(data, stackData, stackedData), 0); // TODO
    
    const nkeys = stackData.keys.length;
    // yRiver.domain([-nkeys*3.5, nkeys*3.5]);
    yRiver.domain([-stackData.max/2, stackData.max/2]);

    svgVolume.selectAll(".layer").remove();
    var layer = svgVolume.selectAll(".layer")
      // .data(stack(stackData.data))
      .data(stackedData)
      .enter().append("g")
      .attr("class", "layer");

    layer.append("path")
      .attr("class", "area")
      .attr("d", area)
      .style("fill", function(d) {return globalCategoryColor(query.volumeBy, d.key);})
      .style("opacity", 0.4);
    
    if (toggleThemeRiver) {
      svgVolume.selectAll(".layer")
        .style("display", "block");
      svgVolume.select(".axis-y")
        .style("display", "none");
      svgVolume.selectAll(".line")
        .style("display", "none");
    } else {
      svgVolume.selectAll(".layer")
        .style("display", "none");
      svgVolume.select(".axis-y")
        .style("display", "block");
      svgVolume.selectAll(".line")
        .style("display", "block");
    }

    svgVolume.selectAll(".maintenance")
      .moveToFront();
  }

  this.updateOverviewVolume = function(data) {
    if (svgOverview.select(".line").empty()) {
      svgOverview.append("path")
        .attr("class", "line")
        .style("fill", "none")
        .style("stroke", "steelblue");
    }
    svgOverview.select(".line")
      .datum(data)
      .transition()
      .attr("d", overviewLineLog);

    // svgOverview.select(".axis-X")
    //   .transition().call(XAxis);

    // svgOverview.select(".axis-Y")
    //   .transition().call(YAxis);
  }

  this.highlightGlyphsByLocation = function(location) {
    svgVolume.selectAll(".glyph")
      .filter(function(d) {return d.location === location;})
      .attr("color", "red");
  }
  
  this.dehighlightGlyphs = function() {
    svgVolume.selectAll(".glyph")
      .attr("color", "steelblue");
  }

  this.updateRecords = function(data) {
    if (useLogScale) toggleLogScale();

    svgVolume.selectAll(".glyph").remove(); // TODO: transition
    svgVolume.selectAll(".glyph")
      .data(data).enter()
      .append("circle")
      .attr("class", "glyph")
      .attr("r", "2")
      .style("opacity", 1)
      .style("stroke", function(d) {
        return globalCategoryColor(query.volumeBy, d[query.volumeBy]);
      })
      // .style("stroke", "steelblue")
      .style("fill", function(d) {
        if (d.unique) return globalCategoryColor(query.volumeBy, d[query.volumeBy]);
        else return "white";
      })
      // .style("fill", "white")
      // .attr("cx", function(d) {return (query.t1-query.t0)/query.tg * d.timeSlot;})
      .attr("cx", function(d) {return x(d.eventTime);})
      // .attr("cy", function(d) {return yLinearReverse(d.y);})
      .attr("cy", function(d) {return yRiver(d.y);})
      .attr("title", function(d) {
        const e = events[d.messageID];
        return "<b>recID:</b> " + d._id
          + "<br><b>time:</b> " + d3.isoFormat(d.eventTime)
          + "<br><b>severity:</b> " + d.severity
          + "<br><b>messageID:</b> " + d.messageID
          + "<br><b>component:</b> " + e.component
          + "<br><b>category:</b> " + e.category
          + "<br><b>cobaltJobID: </b> " + d.cobaltJobID
          + "<br><b>backendJobID: </b> " + d.backendJobID
          + "<br><b>machinePartition:</b> " + d.partition
          + "<br><b>location:</b> " + d.location
          + "<br><b>torus:</b> " + (d.location in graphRMNJ ? graphRMNJ[d.location].coords : "") // torusRMNJMap.torus(d.location)
          + "<br><b>CPU:</b> " + d.CPU
          + "<br><b>count:</b> " + d.count
          + "<br><b>controlActions:</b> " + String(events[d.messageID].controlAction).replace(/,/g, ', ')
          + "<br><b>serviceAction:</b> " + events[d.messageID].serviceAction
          + "<br><b>relevantDiagnosticSuites:</b> " + String(events[d.messageID].relevantDiagnosticSuites).replace(/,/g, ', ')
          + "<br><b>message:</b> " + d.message
          + "<br><b>description:</b> " + e.description;
      })
      .on("mouseover", function(d) {
        machineView.highlightLocation(d.location, "red"); // TODO: parent locations
        // machineView.highlightBlock(d.partition, "black");

        timeVolumeChart.highlightArcs([d.messageID]);
        treeMapView.highlightKeys([d.messageID]);
        mdsView.highlightKeys([d.messageID]);
        severityChart.highlightKey(d.severity);
        componentChart.highlightKey(d.component);
        categoryChart.highlightKey(d.category);
        locationTypeChart.highlightKey(d.locationType);

        var controlActionStr = events[d.messageID].controlAction;
        var controlActions = controlActionStr === undefined ? [] : controlActionStr.split(",");
        controlActionChart.highlightKeys(controlActions);
      })
      .on("mouseleave", function(d) {
        machineView.dehighlightLocation(d.location);
        machineView.highlightBlock("");
        timeVolumeChart.highlightArcs([d.messageID]);
        treeMapView.dehighlightKeys();
        mdsView.dehighlightKeys();
        severityChart.dehighlightKey();
        componentChart.dehighlightKey();
        categoryChart.dehighlightKey();
        locationTypeChart.dehighlightKey();
        controlActionChart.dehighlightKey();
      });

    if (toggleThemeRiver) {
      svgVolume.selectAll(".glyph")
        .style("display", "block");
    } else {
      svgVolume.selectAll(".glyph")
        .style("display", "none");
    }
  }
  var updateRecords = this.updateRecords;

  this.updateMaintenanceData = function(data) {
    svgCobaltContent.selectAll(".maintenance").remove();
    svgCobaltContent.selectAll(".maintenance")
      .data(data).enter()
      .append("g")
      .attr("class", "maintenance")
      .style("transform", jobTransform)
      .append("rect")
      // .style("mask", "url(#mask-stripe)")
      .style("fill", "lightgrey")
      .style("opacity", 0.6)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 1)
      .attr("height", 96)
      .attr("title", function(d) {
        return "<b>scheduled maintenance</b>"
          + "<br><b>startTime:</b> " + d3.isoFormat(d.startTime)
          + "<br><b>endTime:</b> " + d3.isoFormat(d.endTime);
      });
    
    svgVolume.selectAll(".maintenance").remove();
    svgVolume.selectAll(".maintenance")
      .data(data).enter()
      .append("g")
      .attr("class", "maintenance")
      .style("transform", jobTransformX)
      .append("rect")
      .style("fill", "lightgrey")
      .style("opacity", 0.6)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 1)
      .attr("height", volumeHeight)
      .attr("title", function(d) {
        return "<b>scheduled maintenance</b>"
          + "<br><b>startTime:</b> " + d3.isoFormat(d.startTime)
          + "<br><b>endTime:</b> " + d3.isoFormat(d.endTime);
      });
  }
 
  function requestBackendJobs(cobaltJobID) {
    var backendGroup = svgCobaltContent.select("#cobalt" + cobaltJobID).select(".backendGroup");
    if (!backendGroup.attr("_loaded")) {
      var query = [cobaltJobID];
      d3.json("/backendJobsByCobaltJobID?query=" + JSON.stringify(query), function(backendJobs) {
        backendJobs.forEach(function(d) {
          d.startTime = new Date(d.startTime);
          d.endTime = new Date(d.endTime);
        });

        backendGroup
          .attr("_loaded", 1)
          .selectAll(".backend")
          .data(backendJobs).enter()
          .append("g")
          .attr("class", "backend")
          .attr("id", function(d) {return "backend" + d._id;})
          .style("transform", jobTransform)
          .attr("title", function(d) {
            return "backendJob"; // TODO
          });
        
        backendJobs.forEach(function(d) {
          var components = partitionParser.components(d.machinePartition);
          var contour = partitionParser.contour(d.machinePartition);
          
          svgCobaltContent.select("#backend" + d._id)
            .selectAll(".backendBox")
            .data(components).enter()
            .append("rect")
            .attr("class", "backendBox")
            .style("vector-effect", "non-scaling-stroke")
            .style("stroke", "black")
            .style("stroke-opacity", "1.0")
            .style("fill", "none")
            // .style("opacity", "0.6")
            .attr("x", 0)
            .attr("y", function(dd, i) {return dd[0];}) 
            .attr("width", 1)
            .attr("height", function(dd) {return dd[1];});
        });
      });
    }
  }

  this.highlightArcs = function(array) {
    highlightedArcs.clear();
    array.forEach(function(d) {
      highlightedArcs.add(d);
    });
    drawArcDiagram();
  }

  this.dehighlightArcs = function() {
    highlightedArcs.clear();
    drawArcDiagram();
  }
  
  function drawArcDiagram() {
    var ctx = volumeCanvas.node().getContext("2d");
    ctx.clearRect(0, 0, width, width/2);

    function drawArcs(msgID, array) {
      ctx.beginPath();
      for (var j=0; j<array.length-1; j++) {
        var i0 = array[j], i1 = array[j+1];
        var center = xNoClamp(query.T0 + query.tg * (i0 + i1)/2);
        var radius = (xNoClamp(query.T0 + query.tg * i1) - xNoClamp(query.T0 + query.tg * i0)) / 2;

        ctx.arc(center, 0, radius, 0, Math.PI);

        if (j==0) ctx.fillText(msgID, center, radius+12);
      }
      ctx.stroke();
    }

    for (var msgID in arcs) {
      var array = arcs[msgID];
      var colorBy = events[msgID][query.volumeBy];
      ctx.strokeStyle = globalCategoryColor(query.volumeBy, colorBy);

      if (highlightedArcs.has(msgID)) {
        ctx.globalAlpha = 1.0;
        // ctx.strokeStyle = "steelblue";
        ctx.lineWidth = 2;
      } else if (highlightedArcs.size == 0) {
        ctx.globalAlpha = 0.4;
        // ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
      } else {
        ctx.globalAlpha = 0.1;
        // ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
      }

      drawArcs(msgID, array);
    }
  }
 
  function pickArc(x, y) {
    var rect = volumeCanvas.node().getBoundingClientRect();
    var X = x - rect.left, Y = y - rect.top;
    const threshold = 400; // 20 pixels
 
    for (var msgID in arcs) {
      var array = arcs[msgID];
      for (var j=0; j<array.length-1; j++) {
        var i0 = array[j], i1 = array[j+1];
        var center = xNoClamp(query.T0 + query.tg * (i0 + i1)/2);
        var radius = (xNoClamp(query.T0 + query.tg * i1) - xNoClamp(query.T0 + query.tg * i0)) / 2;

        var dist2 = (X-center)*(X-center) + Y*Y, 
            radius2= radius*radius;

        if (Math.abs(dist2 - radius2) <= threshold) 
          return msgID;
      }
    }
    return undefined;
  }

  volumeCanvas.on("mousemove", function() {
    var picked = pickArc(d3.event.x, d3.event.y);

    if (picked != undefined) {
      highlightedArcs.clear();
      highlightedArcs.add(picked);
      drawArcDiagram();

      var msgID = picked;
      var e = events[msgID];
      var html = "<b>messageID:</b> " + msgID
        // + "<br><b>count:</b> " + d.data.count
        + "<br><b>severity:</b> " + e.severity
        + "<br><b>component:</b> " + e.component
        + "<br><b>category:</b> " + e.category
        + "<br><b>controlActions:</b> " + String(e.controlAction).replace(/,/g, ', ')
        + "<br><b>serviceAction:</b> " + events[msgID].serviceAction
        + "<br><b>relevantDiagnosticSuites:</b> " + String(e.relevantDiagnosticSuites).replace(/,/g, ', ')
        + "<br><b>description:</b> " + e.description;
      arcTooltip.style("display", "block")
        .html(html);

      // stupid
      treeMapView.dehighlightKeys();
      severityChart.dehighlightKey();
      componentChart.dehighlightKey();
      categoryChart.dehighlightKey();
      locationTypeChart.dehighlightKey();
      controlActionChart.dehighlightKey();

      treeMapView.highlightKeys([msgID]);
      severityChart.highlightKey(e.severity);
      componentChart.highlightKey(e.component);
      categoryChart.highlightKey(e.category);
      // locationTypeChart.highlightKey(d.locationType); // TODO: derive location types for rasbook
      var controlActionStr = e.controlAction;
      var controlActions = controlActionStr === undefined ? [] : controlActionStr.split(",");
      controlActionChart.highlightKeys(controlActions);
    } else {
      treeMapView.dehighlightKeys();
      severityChart.dehighlightKey();
      componentChart.dehighlightKey();
      categoryChart.dehighlightKey();
      locationTypeChart.dehighlightKey();
      controlActionChart.dehighlightKey();
    }
  }).on("mouseleave", function() {
    highlightedArcs.clear();
    drawArcDiagram();
    arcTooltip.style("display", "none");
    treeMapView.dehighlightKeys();
    severityChart.dehighlightKey();
    componentChart.dehighlightKey();
    categoryChart.dehighlightKey();
    locationTypeChart.dehighlightKey();
    controlActionChart.dehighlightKey();
  }).on("click", function() {
    var picked = pickArc(d3.event.x, d3.event.y);

    if (picked != undefined) {
      treeMapView.select([picked]);
      // query["msgID"] = [picked];
      // refresh();
    }
  });

  function drawMidplaneVolumes() {
    var ctx = cobaltCanvas.node().getContext("2d");
    ctx.clearRect(0, 0, width, cobaltHeight);

    if (midplaneVolumes.length == 0) return; // initial
  
    var color = d3.scaleLog()
      .clamp(true)
      .domain([1, midplaneVolumeMax])
      .range(["white", "steelblue"])
      .interpolate(d3.interpolateCubehelixLong);
    var M = midplaneVolumes[0].length, N = 96;
    var xGridSize = cobaltWidth/M * (x.domain()[1].getTime()-x.domain()[0].getTime())/query.tg, 
        yGridSize = cobaltHeight/N*cobaltYScale;

    ctx.globalAlpha = 1;
    for (var i=0; i<N; i++) {
      for (var j=0; j<M; j++) {
        // ctx.fillStyle = color(midplaneVolumes[i][j]);
        ctx.fillStyle = frequencyColorMap2(midplaneVolumes[i][j]);
        ctx.fillRect(
            xNoClamp(query.T0 + query.tg * j),
            yCobalt(i), 
            xGridSize, 
            yGridSize);
      }
    }

  }

  this.updateArcDiagram = function(_) {
    arcs = buildArcs(_);
    drawArcDiagram();

    function buildArcs(data) {
      const nMsgIDs = data.length;
      const nSlots = data[0].volumes.length;
      var results = {};

      for (var i=0; i<nMsgIDs; i++) {
        var msgID = data[i].key;
        if (!(msgID in results)) results[msgID] = [];

        for (var j=0; j<nSlots; j++) {
          if (data[i].volumes[j] != 0) {
            results[msgID].push(j);
          }
        }

        if (results[msgID].length == 0) delete results[msgID];
      }
      return results;
    }
  }

  this.updateMidplaneVolumes = function(volumes) {
    volumes.splice(0, 1); // the first row is for ``all others''
    midplaneVolumes = volumes;
    midplaneVolumeMax = d3.max(midplaneVolumes, function(d) {return d3.max(d, function(dd) {return dd;});});
    midplaneVolumeMax = Math.max(2, midplaneVolumeMax);
    drawMidplaneVolumes();
    return;

    // legacy impl with svg
    svgCobaltContent.selectAll(".mpvg").remove();
    svgCobaltContent.selectAll(".mpvg")
      .data(volumes).enter()
      .append("g")
      .attr("class", "mpvg")
      .style("transform", function(d, i) {
        var scale = "scale(1," + cobaltYScale*cobaltHeight/96 + ")";
        var translate = "translate(0px," + yCobalt(i) + "px)";
        return translate + scale;
      })
      .selectAll(".mpv")
      .data(function(d) {return d;}).enter()
      .append("rect")
      .attr("class", "mpv")
      .attr("x", function(d, i) {return x(query.T0 + query.tg * i);})
      .attr("y", 0)
      .attr("width", 2) // TODO
      .attr("height", 1)
      .attr("fill", function(d) {return color(d);});
  }

  this.updateCobaltData = function(cobaltJobs) {
    svgCobaltContent.selectAll(".cobalt").remove();
    var cobalt = svgCobaltContent.selectAll(".cobalt")
      .data(cobaltJobs).enter()
      .append("g")
      .attr("class", "cobalt")
      .attr("id", function(d, i) {return "cobalt" + d._id;})
      .on("mouseover", function(d) {
        // machineView.highlightBlock(d.machinePartition, d.color);
        machineView.highlightBlock(d.partition, "black");
        requestBackendJobs(d._id);
        svgCobaltContent.select("#cobalt" + d._id)
          // .each(function(){ // bring to front
          //   this.parentNode.appendChild(this);
          // })
          .select(".backendGroup")
          .style("display", "block");
          // .selectAll(".cobaltContour")
          // .style("display", "block");
      })
      .on("mouseleave", function(d) {
        machineView.highlightBlock("");
        svgCobaltContent.select("#cobalt" + d._id)
          .select(".backendGroup")
          .style("display", "none");
        // svgCobaltContent.selectAll(".backend")
        //   .filter(function(dd) {return dd.cobaltJobID == d._id;})
        //   .style("display", "none");
        return;  // TODO
        svgCobaltContent.select("#cobalt" + d._id)
          .selectAll(".cobaltContour")
          .style("display", "none");
      })
      .on("dblclick", function(d) {
        if (cobaltJobHighlighted) {
          zoomOutCobaltJob();
        } else {
          zoomIntoCobaltJob(d);
        }
      });

    if (!toggleJobs) 
      cobalt.style("display", "none");

    cobalt.append("g")
      .attr("class", "backendGroup")
      .style("display", "none");

    cobalt.append("g")
      .attr("class", "cobaltGroup")
      .attr("title", function(d) {
        return "<table class='tooltipTable'><tr><td><b>cobaltJobID:</b></td><td>" + d._id + "</td></tr>"
          + "<tr><td><b>queuedTime:</b></td><td>" + d3.isoFormat(new Date(d.queuedTime)) + "</td></tr>"
          + "<tr><td><b>startTime:</b></td><td>" + d3.isoFormat(new Date(d.startTime)) + "</td></tr>"
          + "<tr><td><b>runTime (s):</b></td><td>" + d.runTimeSeconds + "</td></tr>"
          + "<tr><td><b>mode:</b></td><td>" + d.mode + "</td></tr>"
          + "<tr><td><b>project:</b></td><td>" + projProfileMap.map2(d.projectName) + "</td></tr>"
          + "<tr><td><b>user:</b></td><td>" + userProfileMap.map2(d.userName) + "</td></tr>"
          + "<tr><td><b>queue:</b></td><td>" + d.queue + "</td></tr>"
          + "<tr><td><b>machinePartition:</b></td><td>" + d.machinePartition + "</td></tr>"
          + "<tr><td><b>exitCode:</b></td><td>" + d.exitCode + "</td></tr>"
          + "</table>";
      })
      .style("transform", jobTransform);

    cobaltJobs.forEach(function (cobaltJob) {
      /*
      svgCobaltContent.select("#cobalt" + cobaltJob._id)
        .select(".cobaltGroup")
        .append("rect")
        .attr("class", "cobaltContour")
        .style("vector-effect", "non-scaling-stroke")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("fill", "white")
        .style("opacity", "0.6")
        .style("display", "none")
        .attr("x", 0)
        .attr("y", cobaltJob.contour.min)
        .attr("width", 1)
        .attr("height", cobaltJob.contour.max - cobaltJob.contour.min + 1); */
      
      svgCobaltContent.select("#cobalt" + cobaltJob._id)
        .select(".cobaltGroup")
        .selectAll(".cobaltBox")
        .data(cobaltJob.components).enter()
        .append("rect")
        .attr("class", "cobaltBox")
        .style("vector-effect", "non-scaling-stroke")
        .style("fill", cobaltJob.color)
        // .style("fill", "white")
        .style("fill-opacity", "0.05")
        .style("stroke", cobaltJob.color)
        // .style("stroke", "none")
        .style("stroke-opacity", "0.9")
        .attr("x", 0)
        .attr("y", function(d) {return d[0];}) 
        .attr("width", 1)
        .attr("height", function(d) {return d[1];});
    });
  }

  this.toggleLogScale = function() {
    return; // TODO
    useLogScale = !useLogScale;

    var line = useLogScale ? lineLog : lineLinear;
    var y = useLogScale ? yLog : yLinear;

    svgVolume.selectAll(".line")
      .transition()
      .attr("d", function(d) {return line(d.volumes);});
    svgVolume.select(".axis-y")
      .transition()
      .call(yAxis.scale(y));
  }

  this.toggleBrush = function(b) {
    if (b) {
      svgVolume.append("g")
        .attr("class", "brush")
        .call(volumeBrush);
    } else {
      svgVolume.select(".brush")
        .remove();
    }
  }

  this.toggleJobs = function(b) {
    toggleJobs = b;
    if (b) svgCobaltContent.selectAll(".cobalt").style("display", "block");
    else svgCobaltContent.selectAll(".cobalt").style("display", "none");
  }

  this.toggleHeatMap = function(b) {
    toggleHeatMap = b;
    if (b) cobaltCanvas.style("display", "block");
    else cobaltCanvas.style("display", "none");
  }

  this.toggleThemeRiver = function(b) {
    toggleThemeRiver = b;
    if (b) {
      svgVolume.selectAll(".layer")
        .style("display", "block");
      svgVolume.selectAll(".line")
        .style("display", "none");
      svgVolume.selectAll(".glyph")
        .style("display", "block");
      svgVolume.select(".axis-y")
        .style("display", "none");
    } else {
      svgVolume.selectAll(".layer")
        .style("display", "none");
      svgVolume.selectAll(".line")
        .style("display", "block");
      svgVolume.selectAll(".glyph")
        .style("display", "none");
      svgVolume.select(".axis-y")
        .style("display", "block");
    }
  }

  this.reset = function() {
    useLogScale = true;
    svgVolume.select("#volumeBrush") // FIXME
      .call(volumeBrush.move, null)
      .call(volumeZoom.transform, d3.zoomIdentity);
  }

  function volumeBrushed() {
    removeTooltips(); // TODO

    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;

    var s = d3.event.selection || x.range();
    /*
    query.t0 = x.invert(s[0]).getTime();
    query.t1 = x.invert(s[1]).getTime();
    refresh();
    */
    var domain = [x.invert(s[0]).getTime(), x.invert(s[1]).getTime()];
    x.domain(domain);
    xNoClamp.domain(domain);
    zoomIntoTimeDomain(domain[0], domain[1]);
    
    svgVolume.select(".brush")
      .remove();
    
    svgVolume.select(".axis-x")
      .transition()
      .call(xAxis);
    svgVolume.selectAll(".line")
      .transition()
      .attr("d", function(d) {return lineWarp(d.volumes);});
    svgVolume.selectAll(".glyph")
      .transition()
      .attr("cx", function(d) {return x(d.eventTime);});
    svgCobaltContent.selectAll(".cobaltGroup")
      .transition()
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".backend")
      .transition()
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".maintenance")
      .transition()
      .style("transform", jobTransform);
    svgVolume.selectAll(".maintenance")
      .transition()
      .style("transform", jobTransformX);
    svgCobaltContent.selectAll(".mpvg")
      .transition()
      .style("transform", function(d, i) {
        var scale = "scale(1," + cobaltYScale*cobaltHeight/96 + ")";
        var translate = "translate(0px," + yCobalt(i) + "px)";
        return translate + scale;
      })
      .selectAll(".mpv")
      .attr("x", function(d, i) {return x(query.T0 + query.tg * i);});

    svgVolume.select(".timeLabelLeft")
      .text(d3.isoFormat(x.domain()[0]));
    svgVolume.select(".timeLabelRight")
      .text(d3.isoFormat(x.domain()[1]));
    svgVolume.selectAll(".layer").select("path")
      .transition()
      .attr("d", area);
    volumeZoomTimedOut();
    machineView.toggleBrush(false);
  }

  function overviewBrushed() {
    if (d3.event.sourceEvent == null) return;
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    removeTooltips();
    
    if (d3.event.selection == null) {
      svgOverview.select("#overviewBrush")
        .call(overviewBrush.move, X0.range());
      return;
    }
    var s = d3.event.selection; 
 
    svgVolume.call(volumeZoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
  }

  function zoomIntoTimeDomain(T0, T1) {
    xDomainPrevious = [x.invert(0).getTime(), x.invert(width).getTime()];
    
    var scale = width / (x0(T1) - x0(T0));
    var tx = -x0(T0);
    svgVolume.call(volumeZoom.transform, d3.zoomIdentity
      .scale(scale)
      .translate(tx, 0));
  }

  function zoomIntoMidplaneDomain(M0, M1) {
    var scale = cobaltHeight / (yCobalt0(M1) - yCobalt0(M0));
    var ty = -yCobalt0(M0);

    svgCobalt.call(cobaltZoom.transform, d3.zoomIdentity
      .scale(scale)
      .translate(0, ty));
  }

  function zoomOutMidplaneDomain() {
    svgCobalt.call(cobaltZoom.transform, d3.zoomIdentity);
  }

  function zoomOutCobaltJob() {
    zoomIntoTimeDomain(xDomainBeforeCobaltJobHiglighted[0], xDomainBeforeCobaltJobHiglighted[1]);
    zoomOutMidplaneDomain();

    cobaltJobHighlighted = false;

    machineView.selectPartition("");
  }

  function zoomIntoCobaltJob(cobaltJob) {
    // x direction zoom
    xDomainBeforeCobaltJobHiglighted = [x.invert(0).getTime(), x.invert(width).getTime()];
    zoomIntoTimeDomain(cobaltJob.startTime, cobaltJob.endTime);

    // y direction zoom
    var contour = partitionParser.contour(cobaltJob.machinePartition);
    zoomIntoMidplaneDomain(contour.min, contour.max);
   
    // fade context // TODO

    cobaltJobHighlighted = true;
    
    machineView.selectPartition(cobaltJob.machinePartition);
  }

  function cobaltZoomed() {
    removeTooltips();
    drawMidplaneVolumes();
    
    var t = d3.event.transform;
    cobaltYScale = t.k;
    cobaltYTranslate = t.y;

    yCobalt.domain(t.rescaleY(yCobalt0).domain());
    svgCobalt.select(".axis-cobalt")
      .call(cobaltAxis);

    svgCobaltContent.selectAll(".cobaltGroup")
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".backend")
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".maintenance")
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".mpvg")
      .style("transform", function(d, i) {
        var scale = "scale(1," + cobaltYScale*cobaltHeight/96 + ")";
        var translate = "translate(0px," + yCobalt(i) + "px)";
        return translate + scale;
      });
  }

  var volumeZoomTimer = d3.timer(function() {volumeZoomTimer.stop()});

  function volumeZoomed() {
    // if (!d3.event.sourceEvent) return;
    // if (!d3.event.selection) return;
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    
    removeTooltips();
    drawMidplaneVolumes();
    drawArcDiagram();

    // var line = useLogScale ? lineLog : lineLinear;
    var line = lineWarp;
   
    // svg.select("#volumeBrush")
    //   .call(volumeBrush.move, null);
    
    var t = d3.event.transform;
    x.domain(t.rescaleX(x0).domain());
    xNoClamp.domain(t.rescaleX(x0).domain());

    // svgOverview.select("#overviewBrush")
    //   .call(overviewBrush.move, x.range().map(t.invertX, t));

    svgVolume.select(".axis-x")
      .call(xAxis);
    svgVolume.selectAll(".line")
      .attr("d", function(d) {return line(d.volumes);});
    
    svgVolume.selectAll(".glyph")
      .attr("cx", function(d) {return x(d.eventTime);});

    svgCobaltContent.selectAll(".cobaltGroup")
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".backend")
      .style("transform", jobTransform);
    svgCobaltContent.selectAll(".maintenance")
      .style("transform", jobTransform);
    svgVolume.selectAll(".maintenance")
      .style("transform", jobTransformX);
    svgCobaltContent.selectAll(".mpvg")
      .style("transform", function(d, i) {
        var scale = "scale(1," + cobaltYScale*cobaltHeight/96 + ")";
        var translate = "translate(0px," + yCobalt(i) + "px)";
        return translate + scale;
      })
      .selectAll(".mpv")
      .attr("x", function(d, i) {return x(query.T0 + query.tg * i);});

    svgVolume.select(".timeLabelLeft")
      .text(d3.isoFormat(x.domain()[0]));
    svgVolume.select(".timeLabelRight")
      .text(d3.isoFormat(x.domain()[1]));
    svgVolume.selectAll(".layer").select("path")
      .attr("d", area);

    volumeZoomTimer.restart(volumeZoomTimedOut, 100);
  }

  function volumeZoomTimedOut() {
    query.t0 = x.domain()[0].getTime();
    query.t1 = x.domain()[1].getTime();
    query.T0 = query.t0; 
    query.T1 = query.t1;
    // query.tg = Math.max((query.T1 - query.T0) / width, 1000); // the finest resolution is 1 second
    query.tg = (query.T1 - query.T0) / width * 4;
    refresh();

    var cobaltQuery = {T0: query.T0, T1: query.T1};
    refreshCobaltLog(cobaltQuery);

    volumeZoomTimer.stop();
  }
}
