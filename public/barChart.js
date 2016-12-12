function barChart(name, id, data, geom) {
  const margin = {top: 20, right: 10, bottom: 25, left: 10},
        width = geom.W - margin.left - margin.right,
        height = geom.H - margin.top - margin.bottom;

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

  svg.append("text")
    .attr("class", "barChartTitle")
    .attr("x", 0).attr("y", -4)
    .text(name);

  var tip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.k + ": " + d.v;
    });
  svg.call(tip);
  
  var x = d3.scaleLog()
    .rangeRound([0, width])
    .domain([1, d3.max(data, function(d) {return d.v;})]);
  var y = d3.scaleBand()
    .rangeRound([height, 0])
    .padding(0.05)
    .domain(data.map(function(d) {return d.k;}));
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
  
  svg.selectAll(".bar").data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .style("fill", "steelblue")
    .style("fill-opacity", 0.5)
    .attr("y", function(d) {return y(d.k);})
    .attr("width", function(d) {
      return d.v == 0 ? 0 : x(d.v); // for log
      // return x(d.v);
    })
    .attr("height", function(d) {return y.bandwidth();})
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide)
    .on("click", highlight);
  
  svg.selectAll(".mlabel").data(data)
    .enter().append("text")
    .attr("class", "mlabel")
    .text(function(d) {return d.k;})
    .attr("x", function(d) {return 8;})
    .attr("y", function(d) {return y(d.k) + y.bandwidth()/2 + 4.5;})
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide)
    .on("click", highlight);

  function highlight(d) {
    if (highlighted.has(d.k)) highlighted.delete(d.k); 
    else highlighted.add(d.k);
    
    if (highlighted.size == data.length) highlighted.clear();
    
    svg.selectAll(".bar")
      .style("fill", function(d) {
        if (highlighted.size == 0) return "steelblue"; 
        else if (highlighted.has(d.k)) return "orange"; // color(d.k);
        else return "lightgrey";
      });
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
    x.domain([1, d3.max(data, function(d) {return d.v;})]);
    y.domain(data.map(function(d) {return d.k;}));

    var bars = svg.selectAll(".bar").data(data);
    bars.enter().append("rect")
      .merge(bars)
      .transition()
      .style("fill", function(d) {
        if (highlighted.size == 0) return "steelblue"; 
        else if (highlighted.has(d.k)) return "orange"; // color(d.k);
        else return "lightgrey";
      })
      .style("fill-opacity", 0.5)
      .attr("y", function(d) {return y(d.k);})
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
      .attr("y", function(d) {return y(d.k) + y.bandwidth()/2 + 4.5;});
  
    svg.select(".axis-x")
      .transition().duration(300).call(xAxis);
    
    svg.select(".axis-y")
      .selectAll("text").remove() // remove tick labels
      .transition().duration(300).call(yAxis)
  };
}

