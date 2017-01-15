function torusView(id, geom) {
  const margin = {top: 30, right: 10, bottom: 10, left: 20},
        width = geom.W - margin.left - margin.right,
        height = geom.H - margin.top - margin.bottom;

  $(id).html("");

  d3.select(id)
    .append("canvas")
    .attr("id", "background")
    .attr("width", geom.W)
    .attr("height", geom.H)
    .style("padding", 
      margin.top + "px " + 
      margin.right + "px " + 
      margin.bottom + "px " +
      margin.left + "px");

  var rect = $(id + " #background")[0].getBoundingClientRect();

  d3.select(id)
    .append("canvas")
    .attr("id", "foreground")
    .style("left", rect.left)
    .style("top", rect.top)
    .attr("width", geom.W)
    .attr("height", geom.H)
    .style("position", "fixed")
    .style("padding", 
      margin.top + "px " + 
      margin.right + "px " + 
      margin.bottom + "px " +
      margin.left + "px");

  var svg = d3.select(id)
    .append("svg")
    .style("top", rect.top)
    .style("left", rect.left)
    .style("position", "fixed")
    .attr("width", geom.W)
    .attr("height", geom.H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var background = $("#background")[0].getContext("2d");
  background.strokeStyle = "rgba(0, 0, 0, 0.00)";

  var foreground = $("#foreground")[0].getContext("2d");
  foreground.strokeStyle = "rgba(0, 100, 160, 1)";
  foreground.globalAlpha = 0.5;

  var ndims = 4;
  var dimensions = [0, 1, 2, 3];
  var dimensionNames = ["A", "B", "C", "D"]
  var torusDimensions = [8, 12, 16, 16];
  // var torusDimensions = [2, 2, 2, 2];
  var lbs = [0, 0, 0, 0], ubs = [8, 12, 16, 16];

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
        .tickFormat(function(d) {
          return d.toString(16).toUpperCase();
        })
        .scale(y[d])
    );
  })

  nbs.map(function(d) {
    path(d, background);
    path(d, foreground);
  });

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
    .style("font-size", "10pt")
    .attr("y", -9)
    .text(function(d) {return dimensionNames[d];});

  g.append("g")
    .attr("class", "brush")
    .each(function(d) {
      y[d].brush = d3.brushY()
        .extent([[-8, 0], [16, height]])
        .on("brush", brush)
        .on("end", brush)
      d3.select(this).call(y[d].brush);

      function brush() {
        var s = d3.event.selection;
        if (s == null) {
          lbs[d] = 0; ubs[d] = torusDimensions[d];
        } else {
          lbs[d] = y[d].invert(s[1]); ubs[d] = y[d].invert(s[0]);
        }
        updateSelection();
      }
    })
    .selectAll("rect");

  function updateSelection() {
    var selected = [];
    for (var i=0; i<nbs.length; i++) {
      var match = true;
      for (var j=0; j<ndims; j++) {
        if (nbs[i][j] < lbs[j] || nbs[i][j] > ubs[j]) {
          match = false;
          break;
        }
      }
      if (match) selected.push(nbs[i]);
    }
    
    foreground.clearRect(0, 0, geom.W, geom.H);
    selected.map(function(d) {
      path(d, foreground);
    });
  }

  function path(d, ctx) {
    ctx.beginPath();
    dimensions.map(function(p, i) {
      // console.log(x(p), y[p](d[p]));
      if (i==0) {
        ctx.moveTo(x(p), y[p](d[p]));
      } else {
        ctx.lineTo(x(p), y[p](d[p]));
      }
    });
    ctx.stroke();
    // return line(dimensions.map(function(p) {
    //   return [x(p), y[p](d[p])];
    // }));
  }
}
