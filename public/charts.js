d3.json("/cube?query={}", function (d) {
  updateCharts(d);
});

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

function updateCharts(data) {
  console.log(data);

  updateBarChart("#severityChart", histogramToArray(data.severity));
  updateBarChart("#componentChart", histogramToArray(data.component));
  updateBarChart("#categoryChart", histogramToArray(data.category));
  updateBarChart("#locationTypeChart", histogramToArray(data.category));
  updateTimeVolumeChart("#timeVolumeChart", histogramToArray(data.timeVolume));
}

function updateBarChart(id, data) {
  const W = 150, H = 150;
  const margin = {top: 10, right: 20, bottom: 25, left: 50},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("class", "barchart")
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleLinear()
    .rangeRound([0, width])
    .domain(d3.extent(data, function(d) {return d.v;}));
  var y = d3.scaleBand()
    .rangeRound([height, 0])
    .padding(0.1)
    .domain(data.map(function(d) {return d.k;}));

  var xAxis = d3.axisBottom().scale(x).ticks(3), 
      yAxis = d3.axisLeft().scale(y);

  svg.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis axis-y")
    .call(yAxis);

  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .style("fill", "steelblue")
    .attr("y", function(d) {return y(d.k);})
    .attr("width", function(d) {return x(d.v);})
    .attr("height", function(d) {return y.bandwidth();});
}

function updateTimeVolumeChart(id, data) {
  const W = 600, H = 150;
  const margin = {top: 10, right: 20, bottom: 25, left: 50},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;

  // data.forEach(function(e) {e.k = new Date(e.k);});
  console.log(data);

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("class", "timelineChart")
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleTime()
    .rangeRound([0, width])
    .domain(d3.extent(data, function(d) {return d.k;}));
  var y = d3.scaleLinear()
    .rangeRound([height, 0])
    .domain(d3.extent(data, function(d) {return d.v;}));

  var line = d3.line()
    .x(function(d) {return x(d.k);})
    .y(function(d) {return y(d.v);});

  var xAxis = d3.axisBottom().scale(x), 
      yAxis = d3.axisLeft().scale(y);

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
}

