function barChart(name, id, data, humanReadableText, geom) {
  const margin = {top: 20, right: 10, bottom: 20, left: 10},
        width = geom.W - margin.left - margin.right,
        height = geom.H - margin.top - margin.bottom;

  var useLogScale = true;
  var highlighted = new Set;

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

  svg.append("g")
    .attr("class", "barChartTitle")
    .attr("transform", "translate(0,-4)");

  svg.select(".barChartTitle")
    .append("text")
    .text(name);

  var xMax = d3.max(data, function(d) {return d.v;});
  var xDomainLog = [1, xMax], 
      xDomainLinear = [0, xMax];

  var xLog = d3.scaleLog()
    .rangeRound([0, width])
    .clamp(true)
    .domain(xDomainLog);
  var xLinear = d3.scaleLinear()
    .rangeRound([0, width])
    .domain(xDomainLinear);
  var y = d3.scaleBand()
    .rangeRound([height, 0])
    .padding(0.05)
    .domain(data.map(function(d) {return d.k;}));
 
  var color0 = d3.scaleOrdinal(d3.schemeCategory10);
  var keys = [];
  for (var i=0; i<data.length; i++) 
    keys.push(data[i].k);
  color0.domain(keys);
  var color = function(i) {
    if (query.volumeBy == name) {
      return color0(i);
    } else if (highlighted.size == 0) {
      return "steelblue";
    } else if (highlighted.has(i)) {
      return "orange";
    } else {
      return "lightgrey";
    }
  }

  var xAxis = d3.axisBottom()
    .scale(xLog)
    .ticks(3)
    .tickFormat(function(d) {
      return d3.format(".2s")(d);
      // if (useLogScale) return "10" + formatPower(Math.round(Math.log10(d)));
      // else return d;
    });
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
  
  svg.selectAll(".bar").data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .style("fill", "steelblue")
    .style("fill-opacity", 0.5)
    .attr("y", function(d) {return y(d.k);})
    .attr("width", function(d) {
      return d.v == 0 ? 0 : xLog(d.v); // for log
      // return x(d.v);
    })
    .attr("height", function(d) {return y.bandwidth();})
    .attr("title", function(d) {
      return humanReadableText[d.k] + ": " + d3.format(",")(d.v);
    })
    .on("click", highlight);
  
  svg.selectAll(".mlabel").data(data)
    .enter().append("text")
    .attr("class", "mlabel")
    .text(function(d) {return d.k;})
    .attr("x", function(d) {return 8;})
    .attr("y", function(d) {return y(d.k) + y.bandwidth()/2 + 4.5;})
    .attr("title", function(d) {
      return humanReadableText[d.k] + ": " + d3.format(",")(d.v);
    })
    .on("click", highlight);

  function highlight(d) {
    if (d == undefined) {
      highlighted.clear();
    } else {
      if (highlighted.has(d.k)) highlighted.delete(d.k); 
      else highlighted.add(d.k);
      if (highlighted.size == data.length) highlighted.clear();
    }
    
    svg.selectAll(".bar")
      .style("fill", function(d) {return color(d.k);});
    svg.selectAll(".mlabel")
      .style("font-weight", function(d) {
        if (highlighted.has(d.k)) return "bold";
      })
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
    xMax = d3.max(data, function(d) {return d.v;});
    xDomainLog = [1, xMax];
    xDomainLinear = [0, xMax];
    xLog.domain(xDomainLog);
    xLinear.domain(xDomainLinear);

    var x = useLogScale ? xLog : xLinear;

    var bars = svg.selectAll(".bar").data(data);
    bars.enter().append("rect")
      .merge(bars)
      .transition()
      .style("fill", function(d) {
        return color(d.k);
        // if (highlighted.size == 0) return "steelblue"; 
        // else if (highlighted.has(d.k)) return "orange"; // color(d.k);
        // else return "lightgrey";
      })
      .style("fill-opacity", 0.5)
      .attr("y", function(d) {return y(d.k);})
      .attr("title", function(d) {
        return humanReadableText[d.k] + ": " + d3.format(",")(d.v);
      })
      .attr("width", function(d) {
        return d.v == 0 ? 0 : x(d.v); // for log
        // return x(d.v);
      })
      .attr("height", function(d) {return y.bandwidth();});
    bars.exit().remove();
  
    var labels = svg.selectAll(".mlabel").data(data);
    labels.enter().append("text")
      .merge(labels)
      .style("font-weight", function(d) {
        if (highlighted.has(d.k)) return "bold";
        else return "regular";
      })
      .style("fill", function(d) {
        if (highlighted.size == 0 || highlighted.has(d.k)) return "black";
        else return "grey";
      })
      .text(function(d) {return d.k;})
      .attr("title", function(d) {
        return humanReadableText[d.k] + ": " + d3.format(",")(d.v);
      })
      .attr("y", function(d) {return y(d.k) + y.bandwidth()/2 + 4.5;});
  
    svg.select(".axis-x")
      .transition().duration(300).call(xAxis);
    
    svg.select(".axis-y")
      .selectAll("text").remove() // remove tick labels
      .transition().duration(300).call(yAxis)
  };
  
  this.toggleLogScale = function() {
    useLogScale = !useLogScale;
    var x = useLogScale ? xLog : xLinear;

    svg.selectAll(".bar")
      .transition()
      .attr("width", function(d) {return x(d.v);});
    svg.select(".axis-x")
      .transition()
      .call(xAxis.scale(x));
  }

  this.reset = function() {
    useLogScale = true;
    highlight(undefined);
  }
}

