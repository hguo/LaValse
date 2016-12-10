var query = {};
var severityChart, componentChart, categoryChart, locationTypeChart;

init();

function init() {
  d3.json("/cube?query={}", function (d) {
    severityChart = new barChart("severity", "#severityChart", histogramToArray(d.severity)); 
    componentChart = new barChart("component", "#componentChart", histogramToArray(d.component)); 
    categoryChart = new barChart("category", "#categoryChart", histogramToArray(d.category)); 
    locationTypeChart = new barChart("locationType", "#locationTypeChart", histogramToArray(d.locationType));
    timeVolumeChart("#timeVolumeChart", histogramToArray(d.timeVolume));
  });
}

function refresh() {
  d3.json("/cube?query=" + JSON.stringify(query), function (d) {
    console.log(query);
    console.log(d);
    severityChart.updateData(histogramToArray(d.severity));
    componentChart.updateData(histogramToArray(d.component));
    categoryChart.updateData(histogramToArray(d.category));
    locationTypeChart.updateData(histogramToArray(d.locationType));
    timeVolumeChart("#timeVolumeChart", histogramToArray(d.timeVolume));
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

function barChart(name, id, data) {
  const W = 200, H = 300;
  const margin = {top: 10, right: 10, bottom: 25, left: 10},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;

  var highlighted = new Set;

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("class", "barchart")
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var tip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.k + ": " + d.v;
    });
  svg.call(tip);
  
  var x = d3.scaleLog()
    .rangeRound([0, width]);
  var y = d3.scaleBand()
    .rangeRound([height, 0])
    .padding(0.05);
  // var color = d3.scaleOrdinal(d3.schemeCategory20)
  //   .domain(d3.extent(data, function(d) {return d.k;}));

  var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(3);
  var yAxis = d3.axisLeft()
    .scale(y)
    .tickSizeInner(3)
    .tickSizeOuter(1);

  svg.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis axis-y")
    .call(yAxis)
    .selectAll("text").remove(); // remove tick labels

  function highlight(d) {
    if (highlighted.has(d.k)) highlighted.delete(d.k); 
    else highlighted.add(d.k);
    
    if (highlighted.size == data.length) highlighted.clear();
    
    svg.selectAll(".bar")
      .style("fill", function(d) {
        if (highlighted.size == 0 || highlighted.has(d.k)) return "lightblue"; // color(d.k);
        else return "lightgrey";
      });
    svg.selectAll(".mlabel")
      .style("fill", function(d) {
        if (highlighted.size == 0 || highlighted.has(d.k)) return "black";
        else return "grey";
      });

    if (highlighted.size == 0) delete query[name];
    else {
      query[name] = []; 
      highlighted.forEach(function(v) {
        query[name].push(v);
      });
    }
    refresh();
  }

  this.updateData = function(data) {
    x.domain([1, d3.max(data, function(d) {return d.v;})]);
    y.domain(data.map(function(d) {return d.k;}));

    svg.selectAll(".bar").remove(); 
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .style("fill", function(d) {
        if (highlighted.size == 0 || highlighted.has(d.k)) return "lightblue"; // color(d.k);
        else return "lightgrey";
      })
      .attr("y", function(d) {return y(d.k);})
      .attr("width", function(d) {
        // return d3.max([10, x(d.v)]);
        // return d.v == 0 ? 0 : x(d.v);
        return x(d.v);
      })
      .attr("height", function(d) {return y.bandwidth();})
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide)
      .on("click", highlight);
  
    svg.selectAll(".mlabel").remove(); 
    svg.selectAll(".mlabel")
      .data(data)
      .enter().append("text")
      .attr("class", "mlabel")
      .style("fill", function(d) {
        if (highlighted.size == 0 || highlighted.has(d.k)) return "black";
        else return "grey";
      })
      .text(function(d) {return d.k;})
      .attr("x", function(d) {return 8;})
      .attr("y", function(d) {return y(d.k) + y.bandwidth()/2 + 4.5;})
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide)
      .on("click", highlight);
  
    svg.select(".axis-x")
      .transition().duration(300).call(xAxis);
    
    svg.select(".axis-y")
      .selectAll("text").remove() // remove tick labels
      .transition().duration(300).call(yAxis)
  };
  
  this.updateData(data);
}


function timeVolumeChart(id, data) {
  const W = 800, H = 120;
  const margin = {top: 10, right: 20, bottom: 25, left: 50},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("class", "timeVolumeChart")
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleTime()
    .rangeRound([0, width])
    .domain(d3.extent(data, function(d) {return d.k;}));
  var y = d3.scaleLog()
    .rangeRound([height, 0])
    .domain(d3.extent(data, function(d) {return d.v;}))
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
}

