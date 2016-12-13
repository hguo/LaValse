function timeVolumeChart(id, data, geom) {
  const margin = {top: 10, right: 10, bottom: 25, left: 50},
        width = geom.W - margin.left - margin.right,
        height = geom.H - margin.top - margin.bottom;

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("class", "chart")
    .style("top", geom.T)
    .style("left", geom.L)
    .attr("width", geom.W)
    .attr("height", geom.H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  var tip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.k + ": " + d.v;
    });
  svg.call(tip);

  var zoom = d3.zoom()
    .scaleExtent([1, 10000])
    // .translateExtent([0, 0], [width, height])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

  var x0 = d3.scaleTime()
    .rangeRound([0, width])
    .domain(d3.extent(data, function(d) {return d.k;}));
  var x = d3.scaleTime()
    .clamp(true)
    .rangeRound([0, width])
    .domain(d3.extent(data, function(d) {return d.k;}));
  var y = d3.scaleLog()
    .rangeRound([height, 0])
    .clamp(true)
    .domain([1, d3.max(data, function(d) {return d.v;})])
    .nice(8);

  var line = d3.line()
    .x(function(d) {return x(d.k);})
    .y(function(d) {return y(d.v);});

  var xAxis = d3.axisBottom().scale(x), 
      yAxis = d3.axisLeft().scale(y).ticks(4);

  svg.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis axis-y")
    .call(yAxis);

  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .style("fill", "none")
    .style("stroke", "steelblue")
    .attr("d", line);

  var cursor = svg.append("line")
    .attr("class", "cursor")
    .style("display", "none")
    .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", height)
    .style("stroke", "black")
    .style("stroke-dasharray", "2,2");

  var cursorPoint = svg.append("circle")
    .attr("class", "cursorPoint")
    .style("display", "none")
    .attr("r", 3)
    .on("mouseover", tip.show)
    .on("mouseout", tip.show);

  var brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("end", brushed);
  svg.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(zoom);

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
    // x.domain(d3.extent(data, function(d) {return d.k;}));
    y.domain([1, d3.max(data, function(d) {return d.v;})]);
  
    svg.select(".line")
      .datum(data)
      // .transition()
      .attr("d", line);

    svg.select(".axis-x")
      .transition().call(xAxis);
    
    svg.select(".axis-y")
      .transition().call(yAxis)
  }

  function brushed() {
    var s = d3.event.selection || x.range();
    query.t0 = x.invert(s[0]).getTime();
    query.t1 = x.invert(s[1]).getTime();
    refresh();
  }

  var zoomTimer = d3.timer(function() {zoomTimer.stop()});

  function zoomed() { // TODO
    var t = d3.event.transform;
    x.domain(t.rescaleX(x0).domain());
    svg.select(".axis-x").call(xAxis);
    svg.select(".line").attr("d", line);

    zoomTimer.restart(zoomTimedOut, 200);
  }

  function zoomTimedOut() {
    query.t0 = x.domain()[0].getTime();
    query.t1 = x.domain()[1].getTime();
    query.T0 = query.t0; 
    query.T1 = query.t1;
    query.tg = (query.T1 - query.T0) / width;
    refresh();
    zoomTimer.stop();
  }
}
