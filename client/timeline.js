function updateTimelineView(data) {
  const W = 1000, H = 100;
  const margin = {top: 10, right: 20, bottom: 25, left: 25},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;

  var parseTime = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
  data.forEach(function(e) {
    e.EVENT_TIME = parseTime(e.EVENT_TIME); 
  });

  var svg = d3.select("body").append("svg")
    .attr("id", "timelineView")
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleTime()
    .rangeRound([0, width]);
  var y = d3.scaleLinear()
    .rangeRound([height, 0]);

  var xAxis = d3.axisBottom()
      .scale(x);
  var yAxis = d3.axisLeft()
      .scale(y)
      .ticks(8);
  	
  x.domain(d3.extent(data, function(d) {return d.EVENT_TIME;}));
  y.domain(d3.extent(data, function(d) {return d.CPU;}));

  svg.append("g")
    .attr("class", "axis x")
    .attr("transform", "translate(0," + height +")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "axys y")
    .call(yAxis);

  svg.selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .style("fill", "steelblue")
    .attr("cx", function(d) {return x(d.EVENT_TIME);})
    .attr("cy", function(d) {return y(d.CPU);})
    .on("click", function(d) {
      highlightBlock(d.BLOCK);
      highlightNodeBoard(d.LOCATION);
      console.log(d);
      // console.log(parseRASMessageID(d.MSG_ID));
    });

  /*
  }, function(error, data) {
    console.log(data);

  */
}

// createTimelineView();
