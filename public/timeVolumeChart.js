function timeVolumeChart(id, data, geom) {
  const margin = {top: 10, right: 10, bottom: 25, left: 30},
        width = geom.W - margin.left - margin.right,
        height = geom.H - margin.top - margin.bottom;
  
  var useLogScale = true;

  var zoom = d3.zoom()
    .scaleExtent([1, 10000000])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("class", "chart")
    .style("top", geom.T)
    .style("left", geom.L)
    .attr("width", geom.W)
    .attr("height", geom.H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

  var xDomain = [query.T0, query.T1];
  var yMax = d3.max(data, function(d) {return d3.max(d, function(dd) {return dd;});});
  yMax = ceilPow(yMax);
  var yDomainLog = [1, yMax],
      yDomainLinear = [0, yMax];

  var x0 = d3.scaleTime()
    .rangeRound([0, width])
    .domain(xDomain);
  var x = d3.scaleTime()
    .clamp(true)
    .rangeRound([0, width])
    .domain(xDomain);
  var yLog = d3.scaleLog()
    .rangeRound([height, 0])
    .clamp(true)
    .domain(yDomainLog)
    .nice(4);
  var yLinear = d3.scaleLinear() 
    .rangeRound([height, 0])
    .clamp(true)
    .domain(yDomainLinear)
    .nice(8);
  var yLinearReverse = d3.scaleLinear() 
    .rangeRound([0, height])
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

  svg.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis axis-y")
    .call(yAxis);

  svg.selectAll(".line")
    .data(data)
    .enter()
    .append("path")
    .attr("class", "line")
    .style("fill", "none")
    // .style("stroke", "steelblue")
    .style("stroke", function(d, i) {return color(i);})
    .attr("d", function(d) {return lineLog(d);});

  var cursor = svg.append("line")
    .attr("class", "cursor")
    .style("display", "none")
    .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", height)
    .style("stroke", "black")
    .style("stroke-dasharray", "2,2");

  /*
  var cursorPoint = svg.append("circle") // TODO
    .attr("class", "cursorPoint")
    .style("display", "none")
    .attr("r", 4); */

  var brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("end", brushed);
  svg.append("g")
    .attr("class", "brush")
    .call(brush);

  /*
    // .call(brush.move, x.range())
    .on("mouseover", function() {
      cursor.style("display", null);
      cursorPoint.style("display", null);
    })
    .on("mouseout", function() {
      cursor.style("display", "none");
      cursorPoint.style("display", "none");
    })
    .on("mousemove", function() {
      var mx = x.invert(d3.mouse(this)[0]);
      var bisect = d3.bisector(function(d) {return d.k;}).left; 
      var i = bisect(data, mx);

      cursor.attr("transform", "translate(" + x(mx) + ",0)");
      cursorPoint.attr("transform", "translate(" + x(mx) + "," + y(data[i].v) + ")");
    });
  */

  this.updateData = function(data) {
    yMax = d3.max(data, function(d) {return d3.max(d, function(dd) {return dd;});});
    if (yMax <= 1000 && useLogScale) toggleLogScale();
    if (yMax >= 10000 && !useLogScale) toggleLogScale();
  
    if (useLogScale) yMax = ceilPow(yMax);
    
    yDomainLog = [1, yMax];
    yDomainLinear = [0, yMax];
    yLog.domain(yDomainLog);
    yLinear.domain(yDomainLinear);
    
    var line = useLogScale ? lineLog : lineLinear;
 
    svg.selectAll(".line").remove();
    svg.selectAll(".line")
      .data(data)
      .enter()
      .append("path")
      .attr("class", "line")
      .style("fill", "none")
      // .style("stroke", "steelblue")
      .style("stroke", function(d, i) {return color(i);})
      .attr("d", function(d) {return line(d);});

    svg.selectAll(".line")
      .data(data)
      // .datum(data)
      // .transition()
      .attr("d", function(d) {
        return line(d);
      });

    svg.select(".axis-x")
      .transition().call(xAxis);
    
    svg.select(".axis-y")
      .transition().call(yAxis)
  }

  this.updateRecords = function(data) {
    if (useLogScale) toggleLogScale();

    svg.selectAll(".glyph").remove(); // TODO: transition
    svg.selectAll(".glyph")
      .data(data).enter()
      .append("circle")
      .attr("class", "glyph")
      .attr("r", "3")
      .style("stroke", "steelblue")
      .style("fill", "white")
      .attr("cx", function(d) {return d.timeSlot * 2;})
      .attr("cy", function(d) {return yLinearReverse(d.y);});
  }

  this.updateCobaltData = function(data) {
    var yCobalt = d3.scaleBand()
      .rangeRound([height, 0])
      .padding(0.01)
      .domain(data.map(function(d) {return d.machinePartition;}));
    var colorCobalt = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(data.map(function(d) {return d._id;}));
    // console.log(yCobalt.domain());
    // return;

    svg.selectAll(".cobalt").remove();
    svg.selectAll(".cobalt")
      .data(data).enter()
      .append("rect")
      .attr("class", "cobalt")
      .style("stroke", "black")
      .style("opacity", "0.4")
      .attr("x", function(d) {return x(d.startTimestamp);})
      .attr("y", function(d) {return yCobalt(d.machinePartition);})
      .attr("width", function(d) {return x(d.endTimestamp) - x(d.startTimestamp);})
      // .attr("height", function(d) {return yCobalt.bandwidth();});
      .attr("height", function(d) {return Math.max(1, yCobalt.bandwidth());}); 
  }

  this.toggleLogScale = function() {
    useLogScale = !useLogScale;

    var line = useLogScale ? lineLog : lineLinear;
    var y = useLogScale ? yLog : yLinear;

    svg.selectAll(".line")
      .transition()
      .attr("d", function(d) {return line(d);});
    svg.select(".axis-y")
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
    svg.select(".axis-x").call(xAxis);
    svg.selectAll(".line").attr("d", line);
    
    svg.selectAll(".cobalt")
      .attr("x", function(d) {return x(d.startTimestamp);})
      .attr("width", function(d) {return x(d.endTimestamp) - x(d.startTimestamp);})

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
      minRunTimeSeconds: query.tg * 2 / 1000, // ms to s
      T0: query.T0, 
      T1: query.T1
    };
    refreshCobaltLog(cobaltQuery);

    zoomTimer.stop();
  }
}
