function graphView() {
  const width = 200, height = 200;
  var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("position", "absolute")
    .style("top", 200)
    .style("left", 960);

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

  d3.json("miserables.json", function(error, graph) {
    if (error) throw error;

    var link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
      .attr("r", 4)
      .attr("fill", function(d) { return color(d.group); })
      .style("stroke", "#fff")
      .style("stroke-width", "1.5px")
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    node.append("title")
        .text(function(d) { return d.id; });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }
  });

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

/*
function graphView() {
  const width = 200, height = 200;

  var svg = d3.select("body")
    .append("svg")
    .attr("id", "graphView")
    .style("position", "absolute");

  var forceLink = d3.forceLink();

  var simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(0))
    .force("link", forceLink)
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width/2, height/2));

  var updateData = function(graph, id) {
    forceLink.id(function(d) {return d[id];});


  }
}
*/
