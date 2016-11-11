function createTimelineView() {
  const W = 1000, H = 100;
  const margin = {top: 10, right: 20, bottom: 25, left: 25},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;

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

  var parseTime = d3.utcParse("%Y-%m-%d %H:%M:%S.%L%L"); // FIXME: cannot parse milliseconds
  d3.csv("ras_event_mira_2015_08.fat.csv", function(d) {
  	d.EVENT_TIME = parseTime(d.EVENT_TIME);
  	return d;
  }, function(error, data) {
    console.log(data);

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
        console.log(parseRASMessageID(d.MSG_ID));
      })
  });
}

createTimelineView();
