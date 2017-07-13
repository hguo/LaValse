function arcView(id, geom) {
  const margin = {top: 10, right: 10, bottom: 10, left: 10},
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

  var centerX = width/2, 
      centerY = height/2,
      radius = Math.min(width, height)/2;
  
  var data = [
    {label: "A", count: 10},
    {label: "B", count: 20},
    {label: "C", count: 30},
    {label: "D", count: 40}
  ];

  var color = d3.scaleOrdinal(d3.schemeCategory20b);

  var arc = d3.arc()
    // .innerRadius(radius/4) 
    .innerRadius(radius/2) 
    .outerRadius(radius);

  var pie = d3.pie()
    .value(function(d) {return d.count;})
    .sort(null);

  var path = svg.append("g")
    .attr("transform", "translate(" + centerX + "," + centerY + ")")
    .selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", function(d, i) {
      return color(d.data.label);
    });
}
