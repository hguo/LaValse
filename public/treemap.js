function treeMapView(id, geom) {
  const margin = {top: 10, right: 10, bottom: 10, left: 10};
  var width, height;

  var selected = new Set;
  var highlighted = new Set;

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("id", "treeMapViewSvg")
    .attr("class", "chart")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  this.resize = function(geom) {
    width = geom.W - margin.left - margin.right,
    height = geom.H - margin.top - margin.bottom;
    
    $("#treeMapViewSvg").css({
      top: geom.T, 
      left: geom.L, 
      width: geom.W, 
      height: geom.H,
      position: "absolute"
    });
  }

  this.updateData = function(data) {
    var treemap = d3.treemap()
      .tile(d3.treemapResquarify)
      .size([width, height])
      .round(true)
      .paddingInner(1);

    var color = d3.scaleOrdinal(d3.schemeCategory20);
    var format = d3.format(",d");
    var titleFunc = function(d) {
      var msgID = d.data.name;
      var e = events[msgID];
      return "<b>messageID:</b> " + msgID
        + "<br><b>count:</b> " + d.data.count
        + "<br><b>severity:</b> " + e.severity
        + "<br><b>component:</b> " + e.component
        + "<br><b>category:</b> " + e.category
        + "<br><b>controlActions:</b> " + String(e.controlAction).replace(/,/g, ', ')
        + "<br><b>serviceAction:</b> " + events[msgID].serviceAction
        + "<br><b>relevantDiagnosticSuites:</b> " + String(e.relevantDiagnosticSuites).replace(/,/g, ', ')
        + "<br><b>description:</b> " + e.description;
    }
  
    var colorFunc = function(d) {
      if (selected.size == 0 || selected.has(d.data.name)) {
        return color(d.parent.data.id);
      } else {
        return "lightgrey";
      }
    }

    var onclickFunc = function(d) {
      var m = d.data.name;
      if (selected.has(m)) selected.delete(m);
      else selected.add(m);
      if (selected.size == data.nnodes) 
        selected.clear();

      svg.selectAll(".cellBox")
        .style("fill", colorFunc);

      if (selected.size == 0) delete query["msgID"];
      else {
        query["msgID"] = [];
        selected.forEach(function(v) {
          query["msgID"].push(v);
        });
        // console.log(query);
      }

      refresh();
    }

    var root = d3.hierarchy(data)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      // .sum(function(d) {return d.count;})
      // .sum(function(d) {return Math.max(d.count, 200);})
      .sum(function(d) {return Math.log10(1+d.count);})
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });
    
    treemap(root);

    svg.selectAll(".cell").remove();
    var cell = svg.selectAll(".cell")
      .exit().remove()
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("class", "cell")
      .attr("transform", function(d) {return "translate(" + d.x0 + "," + d.y0 + ")";});

    cell.append("rect")
      .attr("id", function(d) {return d.data.id;})
      .attr("class", "cellBox")
      .attr("width", function(d) {return d.x1 - d.x0;})
      .attr("height", function(d){return d.y1 - d.y0;})
      .attr("fill", colorFunc)
      .attr("title", titleFunc)
      .on("click", onclickFunc);

    cell.append("clipPath")
      .attr("id", function(d) {return "clip-" + d.data.id;})
      .append("use")
      .attr("xlink:href", function(d) {return "#" + d.data.id;});

    cell.append("text")
      .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
      .attr("class", "cellText")
      .text(function(d) {return d.data.name;})
      .attr("title", titleFunc)
      .attr("x", 4)
      .attr("y", 13)
      .on("click", onclickFunc);

    // cell.append("title")
    //   .text(function(d) { return d.data.id + "\n" + format(d.value); });
  }
}

