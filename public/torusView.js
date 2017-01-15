function torusView(id, geom) {
  const margin = {top: 30, right: 10, bottom: 10, left: 20},
        width = geom.W - margin.left - margin.right,
        height = geom.H - margin.top - margin.bottom;

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .style("top", geom.T)
    .style("left", geom.L)
    .attr("width", geom.W)
    .attr("height", geom.H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var ndims = 4;
  var dimensions = [0, 1, 2, 3];
  var dimensionNames = ["A", "B", "C", "D"]
  var torusDimensions = [8, 12, 16, 16];
  // var torusDimensions = [2, 2, 2, 2];

  var nbs = [];
  for (var a=0; a<torusDimensions[0]; a++) {
    for (var b=0; b<torusDimensions[1]; b++) {
      for (var c=0; c<torusDimensions[2]; c++) {
        for (var d=0; d<torusDimensions[3]; d++) {
          nbs.push([a, b, c, d]);
        }
      }
    }
  }

  var x = d3.scaleLinear()
    .domain([0, 3])
    .range([0, width])
  var y = [];

  for (var i=0; i<ndims; i++) {
    var scale = d3.scaleLinear()
      .domain([0, torusDimensions[i]-1])
      .range([height, 0]);
    y.push(scale);
  }

  var axes = [];
  dimensions.forEach(function(d) {
    axes.push(
      d3.axisLeft()
        .ticks(torusDimensions[d])
        .scale(y[d])
    );
  })

  var line = d3.line();

  // console.time("test")
  svg.append("g")
    .attr("class", "torusLine")
    .selectAll("path")
    .data(nbs).enter()
    .append("path")
    .attr("d", path); 
  // console.timeEnd("test")


  var g = svg.selectAll(".dimension")
    .data(dimensions)
    .enter().append("g")
    .attr("class", "dimension")
    .attr("transform", function(d) {
      return "translate(" + x(d) + ",0)";
    });

  g.append("g")
    .attr("class", "axis")
    .each(function(d) {
      d3.select(this).call(axes[d]);
    })
    .append("text")
    .style("text-anchor", "middle")
    .style("fill", "black")
    .attr("y", -9)
    .text(function(d) {return dimensionNames[d];});

  function path(d) {
    return line(dimensions.map(function(p) {
      return [x(p), y[p](d[p])];
    }));
  }
}
