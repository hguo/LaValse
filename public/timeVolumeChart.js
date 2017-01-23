function timeVolumeChart(geom) {
  const margin = {top: 5, right: 10, bottom: 25, left: 30};
  var width, height; 
  var cobaltRatio, volumeRatio, overviewRatio;
  var cobaltTop, volumeTop, overviewTop;
  var cobaltHeight, volumeHeight, overviewHeight;
  var useLogScale = true;

  var zoom = d3.zoom()
    .on("zoom", zoomed);
  
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
  var x1 = d3.scaleTime()
    .clamp(true)
    .domain(xDomain);

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

  var brush = d3.brushX()
    .on("end", brushed);
  svg.append("g")
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
   
    const cobaltRatio = 0.35, volumeRatio = 0.35, overviewRatio = 0.3;

    cobaltTop = 0;
    volumeTop = cobaltRatio * height;
    overviewTop = (cobaltRatio + volumeRatio) * height;
    
    cobaltHeight = cobaltRatio * height;
    volumeHeight = volumeRatio * height; 
    overviewHeight = overviewRatio * height;

    zoom.scaleExtent([1, 100000000])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]]);
    svg.call(zoom);

    svgCobalt.attr("transform", "translate(0," + cobaltTop + ")");
    svgVolume.attr("transform", "translate(0," + volumeTop + ")");
    svgOverview.attr("transform", "translate(0," + overviewTop + ")");

    x0.rangeRound([0, width]);
    x.rangeRound([0, width]);
    x1.rangeRound([0, width]); // TODO

    yLog.rangeRound([volumeHeight, 0]);
    yLinear.rangeRound([volumeHeight, 0]);
    yLinearReverse.rangeRound([0, volumeHeight]);

    svgVolume.select(".axis-x")
      .attr("transform", "translate(0," + volumeHeight + ")")
      .call(xAxis);

    svgVolume.select(".axis-y")
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

    brush.extent([[0, 0], [width, height]]);
    svg.select(".brush")
      .call(brush);
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
    svg.select(".brush")
      .call(brush.move, null)
      .call(zoom.transform, d3.zoomIdentity);
  }

  function brushed() {
    var s = d3.event.selection || x.range();
    query.t0 = x.invert(s[0]).getTime();
    query.t1 = x.invert(s[1]).getTime();
    refresh();
  }

  var zoomTimer = d3.timer(function() {zoomTimer.stop()});

  function zoomed() { // TODO
    var line = useLogScale ? lineLog : lineLinear;
   
    // svg.select(".brush")
    //   .call(brush.move, null);
    
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

    zoomTimer.restart(zoomTimedOut, 100);
  }

  function zoomTimedOut() {
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

    zoomTimer.stop();
  }
}
