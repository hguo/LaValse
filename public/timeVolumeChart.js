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

  var x = d3.scaleTime()
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

  this.updateData = function(data) {
    x.domain(d3.extent(data, function(d) {return d.k;}));
    y.domain([1, d3.max(data, function(d) {return d.v;})]);
  
    svg.select(".line")
      .datum(data)
      .transition()
      .attr("d", line);

    svg.select(".axis-x")
      .transition().call(xAxis);
    
    svg.select(".axis-y")
      .transition().call(yAxis)
  }
}
