function timeVolumeChart(geom) {
  const margin = {top: 5, right: 10, bottom: 20, left: 50};
  const O0 = 1420070400000, // 2015-01-01
        Og = 86400000; // milliseconds in a day

  var width, height; 
  var cobaltTop, volumeTop, overviewTop;
  var cobaltHeight, volumeHeight, overviewHeight;
  var useLogScale = true;
  
  var cobaltJobHighlighted = false;
  var cobaltYTranslate = 0, cobaltYScale = 1;

  var volumeZoom = d3.zoom()
    .on("zoom", volumeZoomed);

  var cobaltZoom = d3.zoom()
    .on("zoom", cobaltZoomed);
  
  var svg = d3.select("body")
    .append("svg")
    .attr("class", "chart")
    .attr("id", "timeVolumeChartSvg")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var svgCobalt = svg.append("g");
  var svgCobaltContent = svgCobalt.append("g")
    .attr("clip-path", "url(#cobaltMask)");
  var svgVolume = svg.append("g");
  var svgOverview = svg.append("g");
 
  svg.append("defs") // masking cobalt
    .append("clipPath")
    .attr("id", "cobaltMask")
    .append("rect")
    .attr("id", "cobaltMaskRect")
    .attr("x", 0)
    .attr("y", 0);

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
  var X0 = d3.scaleTime() // the overview
    .domain(xDomain);
  var X = d3.scaleTime()
    .domain(xDomain)
    .clamp(true);

  var yLog = d3.scaleLog()
    .clamp(true)
    .domain(yDomainLog)
    .nice(4);
  var YLog = d3.scaleLog()
    .clamp(true)
    .domain(yDomainLog)
    .nice(3);
  var yLinear = d3.scaleLinear() 
    .clamp(true)
    .domain(yDomainLinear)
    .nice(8);
  var yLinearReverse = d3.scaleLinear() 
    .clamp(true)
    .domain([0, 20])
    .nice(8);
  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var midplanes = enumerateMidplanes();
  var yCobalt = d3.scaleLinear()
    .domain([0, 96]);
  var yCobalt0 = d3.scaleLinear()
    .domain([0, 96]);

  var xAxis = d3.axisBottom().scale(x), 
      yAxis = d3.axisLeft().scale(yLog).ticks(3)
        .tickFormat(function(d) {
          return d3.format(".2s")(d);
          // if (useLogScale) return "10" + formatPower(Math.round(Math.log10(d)));
          // else return d3.format(".2s")(d);
        });

  var XAxis = d3.axisBottom().scale(X),
      YAxis = d3.axisLeft().scale(YLog).ticks(3)
        .tickFormat(function(d) {return d3.format(".2s")(d);});

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

  var overviewLineLog = d3.line()
    .x(function(d, i) {return X(O0 + Og*i);})
    .y(function(d) {return YLog(d);});
  
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
  svgVolume.append("g")
    .attr("id", "volumeBrush")
    .attr("class", "brush");

  var overviewBrush = d3.brushX()
    .on("brush end", overviewBrushed);
  svgOverview.append("g")
    .attr("class", "brush")
    .attr("id", "overviewBrush");
 
  var jobTransform = function(d) {
    var t0 = x(d.startTime), t1 = x(d.endTime);
    var scale = "scale(" + (t1-t0) + "," + cobaltYScale*cobaltHeight/96 + ")"
        translate = "translate(" + t0 + "px," + cobaltYTranslate + "px)";
    return translate + scale;
  };

  this.resize = function(geom) {
    $("#timeVolumeChartSvg").css({
      top: geom.T, 
      left: geom.L, 
      width: geom.W, 
      height: geom.H,
      position: "absolute"
    });

    width = geom.W - margin.left - margin.right,
    height = geom.H - margin.top - margin.bottom;
   
    const cobaltRatio = 0.4, volumeRatio = 0.4, overviewRatio = 0.2;
    const padding = 20;

    cobaltTop = 0;
    volumeTop = cobaltRatio * height + padding;
    overviewTop = (cobaltRatio + volumeRatio) * height + padding;
    
    cobaltHeight = cobaltRatio * height;
    volumeHeight = volumeRatio * height - padding;
    overviewHeight = overviewRatio * height - padding;

    volumeZoom.scaleExtent([1, 100000000])
      .translateExtent([[0, volumeTop], [width, volumeHeight]])
      .extent([[0, volumeTop], [width, volumeHeight]]);
    svgVolume.call(volumeZoom);

    volumeBrush.extent([[0, 0], [width, height]]);
    svg.select("#volumeBrush")
      .call(volumeBrush);

    cobaltZoom.scaleExtent([1, 100])
      .translateExtent([[0, cobaltTop], [width, cobaltHeight]])
      .extent([[0, cobaltTop], [width, cobaltHeight]]);
    svgCobalt.call(cobaltZoom)
      .on("dblclick.zoom", null);

    svgCobalt.attr("transform", "translate(0," + cobaltTop + ")");
    svgVolume.attr("transform", "translate(0," + volumeTop + ")");
    svgOverview.attr("transform", "translate(0," + overviewTop + ")");

    svg.select("#cobaltMaskRect")
      .attr("width", width)
      .attr("height", cobaltHeight);

    svgVolume.append("rect") // for zooming
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", volumeHeight)
      .style("fill", "white")
      .style("opacity", "0");

    svgCobaltContent.append("rect") // for zooming
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", cobaltHeight)
      .style("fill", "white")
      .style("opacity", "0");

    x0.range([0, width]);
    x.range([0, width]);
    X0.range([0, width]); 
    X.range([0, width]); 

    yLog.rangeRound([volumeHeight, 0]);
    yLinear.rangeRound([volumeHeight, 0]);
    yLinearReverse.rangeRound([0, volumeHeight]);
    YLog.rangeRound([overviewHeight, 0]);
    
    yCobalt.rangeRound([0, cobaltHeight]);
    yCobalt0.range([0, cobaltHeight]);

    svgVolume.select(".axis-x")
      .attr("transform", "translate(0," + volumeHeight + ")")
      .call(xAxis);

    svgVolume.select(".axis-y")
      .call(yAxis);

    svgVolume.append("text")
      .attr("class", "timeLabelLeft")
      .attr("x", 2)
      .attr("y", -2)
      .text(d3.isoFormat(new Date(query.T0)));

    svgVolume.append("text")
      .attr("class", "timeLabelRight")
      .attr("x", width)
      .attr("y", -2)
      .style("text-anchor", "end")
      .text(d3.isoFormat(new Date(query.T1)));

    svgOverview.select(".axis-X")
      .attr("transform", "translate(0," + overviewHeight + ")")
      .call(XAxis);

    svgOverview.select(".axis-Y")
      .call(YAxis);

    svgCobalt.select(".axis-cobalt")
      .call(cobaltAxis);

    var line = useLogScale ? lineLog : lineLinear;
    svgVolume.selectAll(".line")
      .attr("d", function(d) {return line(d);});

    /*
    svgOverview.selectAll(".line")
      .attr("d", function(d) {return overviewLineLog(d);});*/

    svgCobaltContent.selectAll(".cobalt")
      .style("transform", jobTransform);
   
    overviewBrush.extent([[0, 0], [width, overviewHeight]]);
    svgOverview.select("#overviewBrush")
      .call(overviewBrush)
      .call(overviewBrush.move, X0.range());
  }

  this.resize(geom);

  this.updateVolume = function(data) {
    yMax = d3.max(data, function(d) {return d3.max(d, function(dd) {return dd;});});
    if (yMax <= 1000 && useLogScale) toggleLogScale();
    if (yMax >= 10000 && !useLogScale) toggleLogScale();
  
    if (useLogScale) yMax = ceilPow(yMax);
    
    yDomainLog = [1, yMax];
    yDomainLinear = [0, yMax];
    yLog.domain(yDomainLog);
    yLinear.domain(yDomainLinear);
    
    var line = useLogScale ? lineLog : lineLinear;
 
    svgVolume.selectAll(".line").remove();
    svgVolume.selectAll(".line")
      .data(data)
      .enter()
      .append("path")
      .attr("class", "line")
      .style("fill", "none")
      // .style("stroke", "steelblue")
      .style("stroke", function(d, i) {return color(i);})
      .attr("d", function(d) {return line(d);});

    svgVolume.select(".axis-x")
      .transition()
      .call(xAxis);
    
    svgVolume.select(".axis-y")
      .transition()
      .call(yAxis)
  }

  this.updateOverviewVolume = function(data) {
    YMax = d3.max(data, function(d) {return d;});
    YLog.domain([1, YMax]);

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

    svgOverview.select(".axis-X")
      .transition().call(XAxis);

    svgOverview.select(".axis-Y")
      .transition().call(YAxis);
  }

  this.updateRecords = function(data) {
    if (useLogScale) toggleLogScale();

    svgVolume.selectAll(".glyph").remove(); // TODO: transition
    svgVolume.selectAll(".glyph")
      .data(data).enter()
      .append("circle")
      .attr("class", "glyph")
      .attr("r", "3")
      .style("stroke", "steelblue")
      .style("fill", "white")
      // .attr("cx", function(d) {return d.timeSlot * 2;})
      .attr("cx", function(d) {return x(d.eventTime);})
      .attr("cy", function(d) {return yLinearReverse(d.y);})
      .attr("title", function(d) {
        return "<table class='tooltipTable'><tr><td><b>recID:</b></td><td>" + d._id + "</td></tr>"
          + "<tr><td><b>time:</b></td><td>" + d3.isoFormat(d.eventTime) + "</td></tr>"
          + "<tr><td><b>severity:</b></td><td>" + d.severity + "</td></tr>"
          + "<tr><td><b>messageID:</b></td><td>" + d.messageID + "</td></tr>"
          + "<tr><td><b>component:</b></td><td>" + events[d.messageID].component + "</td></tr>"
          + "<tr><td><b>category:</b></td><td>" + events[d.messageID].category + "</td></tr>"
          + "<tr><td><b>cobaltJobID:</b></td><td>" + d.cobaltJobID + "</td></tr>"
          + "<tr><td><b>machinePartition:</b></td><td>" + d.block + "</td></tr>"
          + "<tr><td><b>location:</b></td><td>" + d.location + "</td></tr>"
          + "<tr><td><b>torus:</b></td><td>" + torusRMNJMap.torus(d.location) + "</td></tr>"
          + "<tr><td><b>CPU:</b></td><td>" + d.CPU + "</td></tr>"
          + "<tr><td><b>count:</b></td><td>" + d.count + "</td></tr>"
          + "<tr><td><b>controlActions:</b></td><td>" + String(events[d.messageID].controlAction).replace(/,/g, ', ') + "</td></tr>"
          + "<tr><td><b>serviceAction:</b></td><td>" + events[d.messageID].serviceAction + "</td></tr>"
          + "<tr><td><b>relevantDiagnosticSuites:</b></td><td>" + String(events[d.messageID].relevantDiagnosticSuites).replace(/,/g, ', ') + "</td></tr>"
          + "<tr><td><b>message:</b></td><td>" + d.message + "</td></tr>"
          + "</table>";
      });
  }
  
  function updateBackendJobData(backendJobs) {
    svgCobaltContent.selectAll(".backend").remove();
    svgCobaltContent.selectAll(".backend")
      .data(backendJobs).enter()
      .append("g")
      .attr("class", "backend")
      .attr("id", function(d, i) {return "backend" + d._id;})
      .style("transform", jobTransform)
      .style("display", "none")
      .attr("title", function(d) {
        return "backendJob"; // WIP
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
  }
  this.updateBackendJobData = updateBackendJobData;

  this.updateCobaltData = function(cobaltJobs) {
    svgCobaltContent.selectAll(".cobalt").remove();
    svgCobaltContent.selectAll(".cobalt")
      .data(cobaltJobs).enter()
      .append("g")
      .attr("class", "cobalt")
      .attr("id", function(d, i) {return "cobalt" + d._id;})
      .attr("title", function(d) {
        return "<table class='tooltipTable'><tr><td><b>cobaltJobID:</b></td><td>" + d._id + "</td></tr>"
          + "<tr><td><b>queuedTime:</b></td><td>" + d3.isoFormat(new Date(d.queuedTime)) + "</td></tr>"
          + "<tr><td><b>startTime:</b></td><td>" + d3.isoFormat(new Date(d.startTime)) + "</td></tr>"
          + "<tr><td><b>runTime (s):</b></td><td>" + d.runTimeSeconds + "</td></tr>"
          + "<tr><td><b>mode:</b></td><td>" + d.mode + "</td></tr>"
          + "<tr><td><b>project:</b></td><td>" + projProfileMap.map2(d.cobaltProjectName) + "</td></tr>"
          + "<tr><td><b>user:</b></td><td>" + userProfileMap.map2(d.cobaltUserName) + "</td></tr>"
          + "<tr><td><b>queue:</b></td><td>" + d.queue + "</td></tr>"
          + "<tr><td><b>machinePartition:</b></td><td>" + d.machinePartition + "</td></tr>"
          + "<tr><td><b>exitCode:</b></td><td>" + d.exitCode + "</td></tr>"
          + "</table>";
      })
      .style("transform", jobTransform)
      .on("mouseover", function(d) {
        highlightBlock(d.machinePartition, d.color);
        svgCobaltContent.selectAll(".backend")
          .filter(function(dd) {return dd.cobaltJobID == d._id;})
          .style("display", "block");
        svgCobaltContent.select("#cobalt" + d._id)
          .each(function(){
            this.parentNode.appendChild(this);
          }); 
          // .selectAll(".cobaltContour")
          // .style("display", "block");
      })
      .on("mouseleave", function(d) {
        highlightBlock("");
        svgCobaltContent.selectAll(".backend")
          .filter(function(dd) {return dd.cobaltJobID == d._id;})
          .style("display", "none");
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

    cobaltJobs.forEach(function (cobaltJob) {
      svgCobaltContent.select("#cobalt" + cobaltJob._id)
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
        .attr("height", cobaltJob.contour.max - cobaltJob.contour.min + 1);
      
      svgCobaltContent.select("#cobalt" + cobaltJob._id)
        .selectAll(".cobaltBox")
        .data(cobaltJob.components).enter()
        .append("rect")
        .attr("class", "cobaltBox")
        .style("stroke", "none")
        .style("fill", cobaltJob.color)
        .style("opacity", "0.6")
        .attr("x", 0)
        .attr("y", function(d) {return d[0];}) 
        .attr("width", 1)
        .attr("height", function(d) {return d[1];});
    });
  }

  this.toggleLogScale = function() {
    useLogScale = !useLogScale;

    var line = useLogScale ? lineLog : lineLinear;
    var y = useLogScale ? yLog : yLinear;

    svgVolume.selectAll(".line")
      .transition()
      .attr("d", function(d) {return line(d);});
    svgVolume.select(".axis-y")
      .transition()
      .call(yAxis.scale(y));
  }

  this.reset = function() {
    useLogScale = true;
    svgVolume.select("#volumeBrush")
      .call(volumeBrush.move, null)
      .call(volumeZoom.transform, d3.zoomIdentity);
  }

  function volumeBrushed() {
    removeTooltips(); // TODO
    var s = d3.event.selection || x.range();
    query.t0 = x.invert(s[0]).getTime();
    query.t1 = x.invert(s[1]).getTime();
    refresh();
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
  }

  function zoomIntoCobaltJob(cobaltJob) {
    // retrieve backend jobs
    var query = [cobaltJob._id];
    d3.json("/backendJobsByCobaltJobID?query=" + JSON.stringify(query), function(backendJobs) {
      backendJobs.forEach(function(d) {
        d.startTime = new Date(d.startTime);
        d.endTime = new Date(d.endTime);
      });
      // updateBackendJobData(backendJobs);
    });
    
    // x direction zoom
    xDomainBeforeCobaltJobHiglighted = [x.invert(0).getTime(), x.invert(width).getTime()];
    zoomIntoTimeDomain(cobaltJob.startTime, cobaltJob.endTime);

    // y direction zoom
    var contour = partitionParser.contour(cobaltJob.machinePartition);
    zoomIntoMidplaneDomain(contour.min, contour.max);
   
    // fade context // TODO

    cobaltJobHighlighted = true;
  }

  function cobaltZoomed() {
    removeTooltips();
    
    var t = d3.event.transform;
    cobaltYScale = t.k;
    cobaltYTranslate = t.y;

    yCobalt.domain(t.rescaleY(yCobalt0).domain());
    svgCobalt.select(".axis-cobalt")
      .call(cobaltAxis);

    svgCobaltContent.selectAll(".cobalt")
      .style("transform", jobTransform);
    
    svgCobaltContent.selectAll(".backend")
      .style("transform", jobTransform);
  }

  var volumeZoomTimer = d3.timer(function() {volumeZoomTimer.stop()});

  function volumeZoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    removeTooltips();

    var line = useLogScale ? lineLog : lineLinear;
   
    // svg.select("#volumeBrush")
    //   .call(volumeBrush.move, null);
    
    var t = d3.event.transform;
    x.domain(t.rescaleX(x0).domain());

    svgOverview.select("#overviewBrush")
      .call(overviewBrush.move, x.range().map(t.invertX, t));

    svgVolume.select(".axis-x")
      .call(xAxis);
    svgVolume.selectAll(".line").attr("d", line);
    
    svgVolume.selectAll(".glyph")
      .attr("cx", function(d) {return x(d.eventTime);});

    svgCobaltContent.selectAll(".cobalt")
      .style("transform", jobTransform);
    
    svgCobaltContent.selectAll(".backend")
      .style("transform", jobTransform);

    svgVolume.select(".timeLabelLeft")
      .text(d3.isoFormat(x.domain()[0]));
    svgVolume.select(".timeLabelRight")
      .text(d3.isoFormat(x.domain()[1]));

    volumeZoomTimer.restart(volumeZoomTimedOut, 100);
  }

  function volumeZoomTimedOut() {
    query.t0 = x.domain()[0].getTime();
    query.t1 = x.domain()[1].getTime();
    query.T0 = query.t0; 
    query.T1 = query.t1;
    // query.tg = Math.max((query.T1 - query.T0) / width, 1000); // the finest resolution is 1 second
    query.tg = (query.T1 - query.T0) / width * 2;
    refresh();

    var cobaltQuery = {T0: query.T0, T1: query.T1};
    refreshCobaltLog(cobaltQuery);

    volumeZoomTimer.stop();
  }
}
