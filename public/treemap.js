function treeMapView(id, geom) {
  const margin = {top: 10, right: 10, bottom: 10, left: 10};
  var width, height;

  var selectedKeys = new Set;
  var highlightedKeys = new Set;

  $(id).html("");
  var svg = d3.select(id)
    .append("svg")
    .attr("id", "treeMapViewSvg")
    .attr("class", "chart")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var colorFunc = function(d) {
    if (selectedKeys.size == 0 || selectedKeys.has(d.data.name)) {
      // return color(d.parent.data.id);
      return globalCategoryColor(query.volumeBy, d.parent.data.name);
    } else {
      return "lightgrey";
    }
  }

  this.selectKeys = function(array) { // m is msgID
    array.forEach(function(m) {
      if (selectedKeys.has(m)) selectedKeys.delete(m);
      else selectedKeys.add(m);
    });

    svg.selectAll(".cellBox")
      .style("fill", colorFunc);

    if (selectedKeys.size == 0) delete query["msgID"];
    else {
      query["msgID"] = [];
      selectedKeys.forEach(function(v) {
        query["msgID"].push(v);
      });
    }

    refresh();
  }
  var selectKeys = this.selectKeys;

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

  this.highlightKeys = function(array) {
    highlightedKeys.clear();
    array.forEach(function(d) {
      highlightedKeys.add(d);
    });
    
    svg.selectAll(".cellBox")
      .style("stroke", function(d) {
        if (highlightedKeys.has(d.data.name)) return "black";
      })
      .style("stroke-width", function(d) {
        if (highlightedKeys.has(d.data.name)) return 3;
      });
  }
  var highlightKeys = this.highlightKeys;

  this.dehighlightKeys = function() {
    highlightedKeys.clear();
    svg.selectAll(".cellBox")
      .style("stroke", null)
      .style("stroke-width", null);
  }
  var dehighlightKeys = this.dehighlightKeys;

  this.updateData = function(data0, data) {
    for (let key of highlightedKeys) {
      if (!(key in data0)) {
        highlightedKeys.delete(key); // TODO
      }
    }

    var treemap = d3.treemap()
      .tile(d3.treemapResquarify)
      .size([width, height])
      .round(true)
      .paddingInner(1);

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

    var onClickFunc = function(d) {
      var m = d.data.name;
      selectKeys([m]);
    }

    var onMouseOverFunc = function(d) {
      var m = d.data.name;
      timeVolumeChart.highlightArcs([m]);
      matrixChart.highlightKeys([m]);
      highlightKeys([m]);
      mdsView.highlightKeys([m]);

      var e = events[m];
        
      severityChart.highlightKey(e.severity);
      componentChart.highlightKey(e.component);
      categoryChart.highlightKey(e.category);
      // locationTypeChart.highlightKey(d.locationType); // TODO: derive location types for rasbook

      var controlActionStr = e.controlAction;
      var controlActions = controlActionStr === undefined ? [] : controlActionStr.split(",");
      controlActionChart.highlightKeys(controlActions);
    }

    var onMouseLeaveFunc = function(d) {
      timeVolumeChart.dehighlightArcs();
      dehighlightKeys();
      mdsView.dehighlightKeys();
      matrixChart.dehighlightKeys();
        
      severityChart.dehighlightKey();
      componentChart.dehighlightKey();
      categoryChart.dehighlightKey();
      locationTypeChart.dehighlightKey();
      controlActionChart.dehighlightKey();
    }

    var root = d3.hierarchy(data)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      .sum(function(d) {return d.area;})
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
      .on("click", onClickFunc)
      .on("mouseover", onMouseOverFunc)
      .on("mouseleave", onMouseLeaveFunc);

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
      .on("click", onClickFunc)
      .on("mouseover", onMouseOverFunc)
      .on("mouseleave", onMouseLeaveFunc);

    // cell.append("title")
    //   .text(function(d) { return d.data.id + "\n" + format(d.value); });
  }
}
