function matrixChart(id) {
  const margin = {top: 10, right: 10, bottom: 15, left: 15};
  var width, height;

  // var metric = "L2quantized"; 
  var metric = "pearson";

  var svg = d3.select("body")
    .append("svg")
    .attr("id", "matrixChart")
    .style("position", "absolute")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var colorCorrelation = d3.scaleLinear()
    .domain([-1, 0, 1])
    .range(["darkblue", "white", "red"]);
  var colorDistance = d3.scaleLinear()
    .range(["#de2d26", "white"]);

  var label0 = svg.append("text")
    .attr("id", "label0")
    .style("text-anchor", "middle");
  var label1 = svg.append("text")
    .attr("id", "label1")
    .style("text-anchor", "middle");

  this.resize = function(geom) {
    width = geom.W - margin.left - margin.right;
    height = geom.H - margin.top - margin.bottom;
    
    d3.select("#matrixChart")
      .style("top", geom.T)
      .style("left", geom.L)
      .style("width", geom.W)
      .style("height", geom.H);

    label0.attr("transform", "translate(-10," + height/2 + ")rotate(90)");
    label1.attr("transform", "translate(" + width/2 + "," + (height+10) + ")");
  }

  this.updateData = function(msgIDVolumes) {
    const msgIDs = Object.keys(msgIDVolumes);
    const n = msgIDs.length;
    const cellW = width/n, cellH = height/n;
    
    var matrixCorrelation = temporalMsgIdCorrelation(msgIDVolumes);
    var matrixSimilarity = temporalMsgIdDistance(msgIDVolumes);

    var correlations = [];
    for (var i=0; i<n; i++) {
      for (var j=0; j<i; j++) {
        correlations.push([i, j, matrixCorrelation[i][j]]);
      }
    }
    
    var similarities = [];
    for (var i=0; i<n; i++) {
      for (var j=0; j<i; j++) {
        similarities.push([i, j, matrixSimilarity[i][j]]);
      }
    }

    colorDistance.domain([0, d3.max(matrixSimilarity, function(d) {return d[2];})]);

    var formatFloat = d3.format(".3f");

    svg.selectAll(".cell").remove();
    
    // upper part
    svg.selectAll(".cellU")
      .data(correlations).enter()
      .append("rect")
      .attr("class", "cellU cell")
      .attr("fill", function(d) {return colorCorrelation(d[2]);})
      .attr("x", function(d) {return d[0] * cellW;})
      .attr("y", function(d) {return d[1] * cellH;});

    svg.selectAll(".cellL")
      .data(similarities).enter()
      .append("rect")
      .attr("class", "cellL cell")
      .attr("fill", function(d) {return colorDistance(d[2]);})
      .attr("x", function(d) {return d[1] * cellW;})
      .attr("y", function(d) {return d[0] * cellH;});

    svg.selectAll(".cell")
      .attr("title", function(d) {
        return formatFloat(d[2]);
      })
      .attr("width", cellW)
      .attr("height", cellH)
      .on("mouseover", function(d) {
        const m0 = msgIDs[d[0]], m1 = msgIDs[d[1]];
        label0.text(m0); 
        label1.text(m1);
        treeMapView.highlight([m0, m1]);
        timeVolumeChart.highlightArcs([m0, m1]);
      })
      .on("mouseleave", function(d) {
        label0.text("");
        label1.text("");
        treeMapView.dehighlight();
        timeVolumeChart.dehighlightArcs();
      })
      .on("click", function(d) {
        const m0 = msgIDs[d[0]], m1 = msgIDs[d[1]];
        if (m0 == m1) treeMapView.select([m0]);
        else treeMapView.select([m0, m1]);
      });
  }
}
