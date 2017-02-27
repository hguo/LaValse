function barChart(name, id, categories, categoryText) {
  const margin = {top: 20, right: 10, bottom: 20, left: 10};

  var highlighted = new Set;

  var svg = d3.select(id)
    .append("svg")
    .style("position", "absolute")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g")
    .attr("class", "barChartTitle")
    .attr("transform", "translate(0,-4)");

  svg.select(".barChartTitle")
    .append("text")
    .text(name);

  var x = d3.scaleLinear()
    .domain([0, 7]);
  var y = d3.scaleBand()
    .padding(0.05)
    .domain(categories);

  var color = function(i) { // TODO
    if (query.volumeBy == name) {
      return globalCategoryColor(name, i);
    } else if (highlighted.size == 0) {
      return "steelblue";
    } else if (highlighted.has(i)) {
      // return "orange";
      return "steelblue";
    } else {
      return "lightgrey";
    }
  }

  var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(8)
    .tickFormat(function(d) {
      if (d == 0) return "0";
      else if (d == 1) return "1";
      else if (d == 4) return "1k";
      else if (d == 7) return "1M";
      else return "";
    });
  var yAxis = d3.axisLeft()
    .scale(y)
    .tickSizeInner(3)
    .tickSizeOuter(1);

  svg.append("g")
    .attr("class", "axis axis-x")
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis axis-y")
    .call(yAxis)
    .selectAll("text").remove(); // remove tick labels

  this.resize = function(geom) {
    const width = geom.W - margin.left - margin.right,
          height = geom.H - margin.top - margin.bottom;
    
    d3.select(id).select("svg")
      .style("top", geom.T)
      .style("left", geom.L)
      .attr("width", geom.W)
      .attr("height", geom.H);

    x.rangeRound([0, width]);
    y.rangeRound([height, 0]);

    svg.select(".axis-x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.select(".axis-y")
      .call(yAxis);

    svg.selectAll(".bar").select("rect")
      .attr("y", function(d) {return y(d.k);})
      .attr("width", function(d) {
        // return x(warpedFreq(d));
        return x(quantizedFreq(d));
      })
      .attr("height", function(d) {return y.bandwidth();});

    svg.selectAll(".mlabel").select("text")
      .attr("y", function(d) {return y(d.k) + y.bandwidth()/2 + 4.5;});
  }

  this.updateData = function(data) {
    var bars = svg.selectAll(".bar").data(data);
    bars.enter().append("rect")
      .merge(bars)
      .transition()
      .attr("class", "bar")
      .style("fill", function(d) {return color(d.k);})
      .style("fill-opacity", 0.5)
      .attr("y", function(d) {return y(d.k);})
      .attr("title", function(d) {
        return categoryText[d.k] + ": " + d3.format(",")(d.v);
      })
      .attr("width", function(d) {
        return x(warpedFreq(d.v));
      })
      .attr("height", function(d) {return y.bandwidth();});
    bars.exit().remove();
  
    var labels = svg.selectAll(".mlabel").data(data);
    labels.enter().append("text")
      .merge(labels)
      .attr("class", "mlabel")
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
        return categoryText[d.k] + ": " + d3.format(",")(d.v);
      })
      .attr("x", function(d) {return 8;})
      .attr("y", function(d) {return y(d.k) + y.bandwidth()/2 + 4.5;});
   
    svg.selectAll(".bar")
      .on("click", highlight);
    svg.selectAll(".mlabel")
      .on("click", highlight);
  
    svg.select(".axis-x")
      .transition().duration(300).call(xAxis);
    
    svg.select(".axis-y")
      .selectAll("text").remove() // remove tick labels
      .transition().duration(300).call(yAxis)
    
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
  };

  this.reset = function() {
    highlight(undefined);
  }
}

