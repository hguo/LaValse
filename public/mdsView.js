function mdsView() {
  const width = 200, height = 200;
  var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("position", "absolute")
    .style("top", 200)
    .style("left", 960);

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  this.highlightKeys = function(array) {
    var set = new Set(array);
    svg.selectAll("circle")
      .filter(function(d) {return set.has(d.id);})
      .style("stroke", "#000")
      .style("stroke", "3px")
      .moveToFront();
  }

  this.dehighlightKeys = function() {
    svg.selectAll("circle")
      .style("stroke", "#fff")
      .style("stroke", "1.5px");
  }

  this.updateData = function(nodes, mat) {
    var mdsNodes = [];
    nodes.forEach(function(d) {
      mdsNodes.push({id: d, vx: 0, vy: 0, x: width/2, y: width/2}); // TODO
    });

    var mdsDist = [];
    const nv = mat.length;
    for (var i=0; i<nv; i++) {
      for (var j=0; j<i; j++) {
        mdsDist.push({
          source: nodes[i], 
          target: nodes[j], 
          dist: mat[i][j]
        });
        mdsDist.push({
          source: nodes[j], 
          target: nodes[i], 
          dist: mat[i][j]
        });
      }
    }

    svg.selectAll("circle").remove();
    var circles = svg.selectAll("circle")
      .data(mdsNodes)
      .enter().append("circle")
      .attr("r", 4)
      .attr("fill", function(d) { return globalCategoryColor4MsgId(query.volumeBy, d.id); })
      .style("stroke", "#fff")
      .style("stroke-width", "1.5px")
      .attr("title", function(d) {return d.id;})
      .on("mouseover", function(d) {
        treeMapView.highlightKeys([d.id]);
        timeVolumeChart.highlightArcs([d.id]);
      
        var e = events[d.id];
          
        severityChart.highlightKey(e.severity);
        componentChart.highlightKey(e.component);
        categoryChart.highlightKey(e.category);
        // locationTypeChart.highlightKey(d.locationType); // TODO: derive location types for rasbook
        var controlActionStr = e.controlAction;
        var controlActions = controlActionStr === undefined ? [] : controlActionStr.split(",");
        controlActionChart.highlightKeys(controlActions);
      })
      .on("mouseleave", function(d) {
        treeMapView.dehighlightKeys();
        timeVolumeChart.dehighlightArcs();
      
        severityChart.dehighlightKey();
        componentChart.dehighlightKey();
        categoryChart.dehighlightKey();
        locationTypeChart.dehighlightKey();
        controlActionChart.dehighlightKey();
      });

    const mdsDistScale = 3.0;
    var forceLink = d3.forceLink(mdsDist)
      .id(function(d) {return d.id;})
      // .strength(function(d) {return 1/(d.dist+0.1);})
      .distance(function(d) {return d.dist * mdsDistScale;});

    var simulation = d3.forceSimulation(mdsNodes)
      .force("charge", d3.forceManyBody().strength(0))
      .force("link", forceLink)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    function ticked() {
      circles.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    }

    // simulation.stop(); // TODO
  }
}

