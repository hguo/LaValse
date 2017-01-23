function timeVolumeChart(geom) {
  const margin = {top: 5, right: 10, bottom: 25, left: 30};
  var width, height; 
  var cobaltTop, volumeTop, overviewTop;
  var cobaltHeight, volumeHeight, overviewHeight;
  var useLogScale = true;

  var volumeZoom = d3.zoom()
    .on("zoom", volumeZoomed);
  
  var svg = d3.select("body")
    .append("svg")
    .attr("class", "chart")
    .attr("id", "timeVolumeChartSvg")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var svgCobalt = svg.append("g");
  var svgVolume = svg.append("g");
  var svgOverview = svg.append("g");
  
  var xDomain = [query.T0, query.T1];
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
    .clamp(true);

  var yLog = d3.scaleLog()
    .clamp(true)
    .domain(yDomainLog)
    .nice(4);
  var yLinear = d3.scaleLinear() 
    .clamp(true)
    .domain(yDomainLinear)
    .nice(8);
  var yLinearReverse = d3.scaleLinear() 
    .clamp(true)
    .domain([0, 20])
    .nice(8);
  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var xAxis = d3.axisBottom().scale(x), 
      yAxis = d3.axisLeft().scale(yLog).ticks(3)
        .tickFormat(function(d) {
          return d3.format(".2s")(d);
          // if (useLogScale) return "10" + formatPower(Math.round(Math.log10(d)));
          // else return d3.format(".2s")(d);
        });

  var XAxis = d3.axisBottom().scale(X),
      YAxis = d3.axisLeft().scale(yLog).ticks(3)
        .tickFormat(function(d) {return d3.format(".2s")(d);});

  var lineLog = d3.line() // .curve(d3.curveBasis)
    .x(function(d, i) {return x(query.T0 + query.tg * i);})
    .y(function(d) {return yLog(d);});
  var lineLinear = d3.line() 
    .x(function(d, i) {return x(query.T0 + query.tg * i);})
    .y(function(d) {return yLinear(d);});
  
  svgVolume.append("g")
    .attr("class", "axis axis-x");

  svgVolume.append("g")
    .attr("class", "axis axis-y");

  svgOverview.append("g")
    .attr("class", "axis axis-X");

  svgOverview.append("g")
    .attr("class", "axis axis-Y");

  var volumeBrush = d3.brushX()
    .on("end", volumeBrushed);
  svg.append("g")
    .attr("id", "volumeBrush")
    .attr("class", "brush");
  
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

    cobaltTop = 0;
    volumeTop = cobaltRatio * height;
    overviewTop = (cobaltRatio + volumeRatio) * height;
    
    cobaltHeight = cobaltRatio * height;
    volumeHeight = volumeRatio * height; 
    overviewHeight = overviewRatio * height;

    volumeZoom.scaleExtent([1, 100000000])
      .translateExtent([[0, volumeTop], [width, volumeHeight]])
      .extent([[0, volumeTop], [width, volumeHeight]]);
    svgVolume.call(volumeZoom);

    svgCobalt.attr("transform", "translate(0," + cobaltTop + ")");
    svgVolume.attr("transform", "translate(0," + volumeTop + ")");
    svgOverview.attr("transform", "translate(0," + overviewTop + ")");

    svgVolume.append("rect") // for zooming
      .attr("width", width)
      .attr("height", volumeHeight)
      .style("fill", "white")
      .style("opacity", "0");

    x0.rangeRound([0, width]);
    x.rangeRound([0, width]);
    X0.rangeRound([0, width]); // TODO
    X.rangeRound([0, width]); // TODO

    yLog.rangeRound([volumeHeight, 0]);
    yLinear.rangeRound([volumeHeight, 0]);
    yLinearReverse.rangeRound([0, volumeHeight]);

    svgVolume.select(".axis-x")
      .attr("transform", "translate(0," + volumeHeight + ")")
      .call(xAxis);

    svgVolume.select(".axis-y")
      .call(yAxis);

    svgOverview.select(".axis-X")
      .attr("transform", "translate(0," + overviewHeight + ")")
      .call(xAxis);

    svgOverview.select(".axis-Y")
      .call(yAxis);

    var line = useLogScale ? lineLog : lineLinear;
    svgVolume.selectAll(".line")
      .attr("d", function(d) {return line(d);});

    svgCobalt.selectAll(".cobalt")
      .style("transform", function(d) {
        var t0 = x(d.startTimestamp), t1 = x(d.endTimestamp);
        var scale = "scale(" + (t1-t0) + "," + cobaltHeight/96 + ")"
            translate = "translate(" + t0 + "px,0px)";
        return translate + scale;
      });

    /*
    volumeBrush.extent([[0, 0], [width, height]]);
    svg.select("#volumeBrush")
      .call(volumeBrushed);
    */
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

    svgVolume.selectAll(".line")
      .data(data)
      // .datum(data)
      // .transition()
      .attr("d", function(d) {
        return line(d);
      });

    svgVolume.select(".axis-x")
      .transition().call(xAxis);
    
    svgVolume.select(".axis-y")
      .transition().call(yAxis)
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
        // TODO
      });
  }

  this.updateCobaltData = function(data) {
    svgCobalt.selectAll(".cobalt").remove();
    svgCobalt.selectAll(".cobalt")
      .data(data).enter()
      .append("g")
      .attr("class", "cobalt")
      .attr("id", function(d, i) {return "job" + i;})
      .style("transform", function(d) {
        var t0 = x(d.startTimestamp), t1 = x(d.endTimestamp);
        var scale = "scale(" + (t1-t0) + "," + cobaltHeight/96 + ")",
            translate = "translate(" + t0 + "px,0px)";
        return translate + scale;
      });

    for (var i=0; i<data.length; i++) {
      var components = partitionParser.components(data[i].machinePartition);
      
      svgCobalt.select("#job" + i)
        .selectAll(".cobaltBox")
        .data(components).enter()
        .append("rect")
        .attr("class", "cobaltBox")
        .style("stroke", "none")
        .style("fill", data[i].color)
        .style("opacity", "0.6")
        .attr("x", 0)
        .attr("y", function(d, i) {return d[0];}) 
        .attr("width", 1)
        .attr("height", function(d) {return d[1];}); 
    }
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
    svg.select("#volumeBrush")
      .call(volumeBrush.move, null)
      .call(volumeZoom.transform, d3.zoomIdentity);
  }

  function volumeBrushed() {
    var s = d3.event.selection || x.range();
    query.t0 = x.invert(s[0]).getTime();
    query.t1 = x.invert(s[1]).getTime();
    refresh();
  }

  var volumeZoomTimer = d3.timer(function() {volumeZoomTimer.stop()});

  function volumeZoomed() { // TODO
    var line = useLogScale ? lineLog : lineLinear;
   
    // svg.select("#volumeBrush")
    //   .call(volumeBrush.move, null);
    
    var t = d3.event.transform;
    x.domain(t.rescaleX(x0).domain());
    svgVolume.select(".axis-x").call(xAxis);
    svgVolume.selectAll(".line").attr("d", line);
    
    svgVolume.selectAll(".glyph")
      .attr("cx", function(d) {return x(d.eventTime);})

    svgCobalt.selectAll(".cobalt")
      .style("transform", function(d) {
        var t0 = x(d.startTimestamp), t1 = x(d.endTimestamp);
        var scale = "scale(" + (t1-t0) + "," + cobaltHeight/96 + ")"
            translate = "translate(" + t0 + "px,0px)";
        return translate + scale;
      });

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

    var cobaltQuery = {
      minRunTimeSeconds: query.tg/2 / 1000, // ms to s
      T0: query.T0, 
      T1: query.T1
    };
    refreshCobaltLog(cobaltQuery);

    volumeZoomTimer.stop();
  }
}
