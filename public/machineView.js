var aabb = {
  collide: function(a, b) { // x, y, w, h
    return !(
      a.y > (b.y + b.h) || 
      (a.x + a.w) < b.x || 
      (a.y + a.h) < b.y ||
      a.x > (b.x + b.w)
    );
  }, 

  inside: function(a, b) {
    function top(a) {return a.y;}
    function bottom(a) {return a.y+a.h;}
    function left(a) {return a.x;}
    function right(a) {return a.x+a.w;}
    return (
      ((top(b) <= top(a)) && (top(a) <= bottom(b))) &&
      ((top(b) <= bottom(a)) && (bottom(a) <= bottom(b))) && 
      ((left(b) <= left(a)) && (left(a) <= right(b))) && 
      ((left(b) <= right(a)) && (right(a) <= right(b)))
    );
  }, 
};

function machineView(id) {
  var width, height;
  var useLogScale = true;
  
  var colorScaleLog = d3.scaleLog()
    .clamp(true)
    .range(["white", "steelblue"])
    .interpolate(d3.interpolateCubehelixLong);
  var colorScaleLinear = d3.scaleLinear()
    .clamp(true)
    .range(["white", "steelblue"]);

  var zoom = d3.zoom()
    .scaleExtent([0.1, 100])
    .on("zoom", zoomed);
  
  var brush = d3.brush()
    .on("end", brushed);

  var canvas = d3.select(id)
    .append("canvas")
    .attr("id", "machineViewCanvas")
    .style("position", "absolute")
  var ctx = canvas.node().getContext("2d");

  var tooltip = d3.select("body")
    .append("div")
    .attr("id", "machineViewTooltip")
    .attr("class", "ui-tooltip ui-corner-all ui-widget-shadow ui-widget ui-widget-content")
    .style("display", "none");
  
  var svg = d3.select(id)
    .append("svg")
    .attr("id", "machineViewSvg")
    .style("position", "absolute")
    .style("z-index", 1);
  
  var legendSvg = d3.select(id)
    .append("svg")
    .attr("id", "legendSvg")
    .style("position", "absolute")
    .style("display", "none") // TODO: remove this component
    .append("g");
  
  var legendAxis = d3.axisRight()
    .ticks(4).tickSize(3)
    .tickFormat(function(d) {return d3.format(".2s")(d);});

  var gradient = legendSvg.append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%")
    .attr("spreadMethod", "pad");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "white")
    .attr("stop-opacity", 1);
  
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "steelblue")
    .attr("stop-opacity", 1);

  legendSvg.append("rect")
    .attr("id", "legendRect")
    .attr("x1", 0)
    .attr("y1", 0)
    .style("fill", "url(#gradient)");

  legendSvg.append("g")
    .attr("class", "axis");
    // .attr("transform", "translate(" + legendWidth + ",0)");
  
  var legendScaleLog = d3.scaleLog();
  var legendScaleLinear = d3.scaleLinear();

  var rects = [];
  var histogram = {};
  var highlightedElements = {};
  var selectedElements = new Set;

  var currentTransform = {x: 0, y: 0, k: 1};
  var currentGeom = {};
  
  var autoLOD = true;
  var previousLOD = 1, currentLOD = 1;

  d3.csv("/machine.csv", function(err, data) {
    data.forEach(function(d) {
      d.lod = +d.lod;
      d.x = +d.x;
      d.y = +d.y;
      d.w = +d.w;
      d.h = +d.h;
    });
    rects = data;
    renderRects();
    
    function pointInside(p, box) {
      return p.x >= box.x && (p.x < box.x + box.w)
        && p.y >= box.y && (p.y < box.y + box.h);
    }
    
    svg.on("mousemove", function() {
      var X = d3.event.x, Y = d3.event.y;
      var pos = {
        x: (X - currentGeom.left - currentTransform.x) / currentTransform.k,
        y: (Y - currentGeom.top - currentTransform.y) / currentTransform.k
      };

      var targetRect = null;
      var matched = [];
      rects.forEach(function(d) {
        if (d.lod >= currentLOD && pointInside(pos, d))
          matched.push(d);
      });

      if (matched.length > 0) {
        // matched.sort(function(a, b) {return a.lod > b.lod;});
        targetRect = matched[matched.length-1];
      
        var L = parseLocation(targetRect.id);
        var neighbors = undefined;
        
        if (L.type === "RMNJ") {
          neighbors = graphRMNJ[L.str];
        } else if (L.type == "RMN") {
          neighbors = graphRMN[L.str];
        } else if (L.type == "RM") {
          neighbors = graphRM[L.str];
        }

        var html = "<b>occurrence:</b> " + (L.str in histogram ? histogram[L.str] : 0)
          + "<br><b>location:</b> " + L.str
          + "<br><b>LOD:</b> " + targetRect.lod
          + "<br><b>locationType:</b> " + L.type
          + "<br><b>locationDetail:</b> " + L.narratives;

        if (L.type === "RMNJ") {
          const directions = ["Ar", "At", "Br", "Bt", "Cr", "Ct", "Dr", "Dt", "Er", "Et"];
          html += "<br><b>torus:</b> " + graphRMNJ[L.str].coords;
          directions.forEach(function (dir) {
            var n = neighbors[dir];
            var nNeighborMessages = (n in histogram ? histogram[n] : 0);
            html += "<br><b>" + dir + ":</b> " + n + "&nbsp;&nbsp;" + graphRMNJ[n].coords;
            if (nNeighborMessages)
              html += "&nbsp;&nbsp;" + nNeighborMessages
                + (nNeighborMessages == 1 ? " msg" : " msg(s)");
          });
        } else if (L.type === "RMN" || L.type === "RM") {
          const directions = ["Ar", "At", "Br", "Bt", "Cr", "Ct", "Dr", "Dt"];
          directions.forEach(function (dir) {
            var n = neighbors[dir];
            var nNeighborMessages = (n in histogram ? histogram[n] : 0);
            html += "<br><b>" + dir + ":</b> " + n;
            if (nNeighborMessages)
              html += "&nbsp;&nbsp;" + nNeighborMessages
                + (nNeighborMessages == 1 ? " msg" : " msg(s)");
          });
        }

        tooltip.style("display", "block");
        tooltip.style("left", X);
        tooltip.style("top", Y+20);
        tooltip.html(html);
      
        var color0 = "black", color1 = "red", color2 = "orange";
        
        highlightedElements = {};
        highlightedElements[L.str] = color0;
        
        if (neighbors != undefined) {
          highlightedElements[neighbors.Ar] = color1;
          highlightedElements[neighbors.At] = color1;
          highlightedElements[neighbors.Br] = color1;
          highlightedElements[neighbors.Bt] = color1;
          highlightedElements[neighbors.Cr] = color1;
          highlightedElements[neighbors.Ct] = color1;
          highlightedElements[neighbors.Dr] = color1;
          highlightedElements[neighbors.Dt] = color1;
          if ("Er" in neighbors) highlightedElements[neighbors.Er] = color1;
        }
        renderRects();
     
        timeVolumeChart.dehighlightGlyphs();
        timeVolumeChart.highlightGlyphsByLocation(L.str);
      } else {
        tooltip.style("display", "none");
      }
    })
    .on("mouseleave", function() {
      tooltip.style("display", "none");
      if (Object.keys(highlightedElements).length>0) {
        highlightedElements = {};
        renderRects();
      }
    })
    .on("click", function() {
      var X = d3.event.x, Y = d3.event.y;
      var pos = {
        x: (X - currentGeom.left - currentTransform.x) / currentTransform.k,
        y: (Y - currentGeom.top - currentTransform.y) / currentTransform.k
      };

      var targetRect = null;
      var matched = [];
      rects.forEach(function(d) {
        if (d.lod >= currentLOD && pointInside(pos, d))
          matched.push(d);
      });

      if (matched.length > 0) {
        targetRect = matched[matched.length-1];
        selectElements([targetRect.id]);
      } else
        selectElements([]);
    });
  });

  function currentViewportBox() {
    return {
      x: -currentTransform.x / currentTransform.k,
      y: -currentTransform.y / currentTransform.k,
      w: width / currentTransform.k,
      h: height / currentTransform.k
    };
  }

  function renderRects() {
    function color(id) {
      if (id in histogram) {
        var val = histogram[id];
        if (selectedElements.size == 0 || selectedElements.has(id))
          return frequencyColorMap2(val);
        else 
          return frequencyColorMap2bw(val);
      } else return "white";
    }

    ctx.clearRect(0, 0, width, height);
    
    // var colorScale = useLogScale ? colorScaleLog : colorScaleLinear;
    const box = currentViewportBox();
    
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(currentTransform.x, currentTransform.y);
    ctx.scale(currentTransform.k, currentTransform.k);
    rects.forEach(function(d) {
      if (d.lod >= currentLOD && aabb.collide(box, d)) {
        ctx.fillStyle = color(d.id);
        // if (d.id in histogram) ctx.fillStyle = color(d.id); // frequencyColorMap2(histogram[d.id]); // colorScale(histogram[d.id]); // TODO
        // else ctx.fillStyle = "white";

        if (d.id in highlightedElements) {
          ctx.shadowColor = highlightedElements[d.id];
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowBlur = 0;
        };
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.shadowBlur = 0;
      
        // if (d.lw * currentTransform.k >= 0.1) {
        if (d.lw > 0) {
          ctx.lineWidth = d.lw;
          ctx.strokeRect(d.x, d.y, d.w, d.h);
        }

        if (d.ts * currentTransform.k >= 4) {
        // if (d.ts > 0) {
          ctx.fillStyle = "black";
          ctx.font = d.ts + "px Arial";
          ctx.fillText(d.text, d.tx, d.ty);
        }
      }
    });

    ctx.restore();
  }

  function setLOD(LOD) {
    currentLOD = LOD;
    if (previousLOD != currentLOD) {
      previousLOD = currentLOD;
      query.LOD = currentLOD;
      renderRects();
      refresh();
    }
  }
  this.setLOD = setLOD;

  var zoomTimer = d3.timer(function() {zoomTimer.stop()});
  
  function zoomed() {
    var t = d3.event.transform;
    currentTransform = {k: t.k, x: t.x, y: t.y};

    if (autoLOD) {
      if (t.k >= 7) currentLOD = 0; // setLOD(0);
      else if (t.k < 0.5) currentLOD = 2;
      else currentLOD = 1; // setLOD(1);
      renderRects();
    } else
      renderRects();

    zoomTimer.restart(zoomTimedOut, 200);
  }

  function zoomTimedOut() {
    const box = currentViewportBox();
    var collided = rects.filter(function(d) {
      return d.lod >= currentLOD && aabb.collide(box, d);
    });

    query.LOD = currentLOD;
    query.location = collided.map(function(d) {return d.id;});
    selectedElements.clear(); // TODO
    refresh();

    zoomTimer.stop();
  }

  function selectElements(array) {
    selectedElements.clear(); // TODO: intersect, union, ...
    var sum = 0;
    array.forEach(function(d) {
      selectedElements.add(d);
      sum += d in histogram ? histogram[d] : 0;
    });
    if (sum == 0) {
      selectedElements.clear();
      zoomTimedOut(); // counter-intuitive. selected all elements in the viewports
    } else {
      query["location"] = array;
      refresh();
    }
  }

  function brushed() {
    var s = d3.event.selection;
    if (s != null) {
      var box = {x: s[0][0], y: s[0][1], w: s[1][0]-s[0][0], h: s[1][1]-s[0][1]};
      box.x = (box.x - currentTransform.x) / currentTransform.k;
      box.w = box.w / currentTransform.k;
      box.y = (box.y - currentTransform.y) / currentTransform.k;
      box.h = box.h / currentTransform.k;
     
      var matched = [];
      rects.forEach(function(d) {
        if (d.lod >= query.LOD) {
          var b = aabb.inside(d, box);
          if (b) {
            matched.push(d.id);
          }
        }
      });
      selectElements(matched);
    } else {
      selectedElements([]);
    }
  }
  
  function updateColorScale(data) {
    const box = currentViewportBox();
    var min = 1e12; max = 0;
   
    /* // viewport dependent coloring
    rects.forEach(function(d) {
      if (d.id in data && aabb.collide(box, d)) { // && d in viewport
        var val = data[d.id];
        max = d3.max([max, val]);
        min = d3.min([min, val]);
      }
    });

    if (rects.length == 0) { // rects are not loaded yet
      for (var key in data) {
        max = d3.max([max, data[key]]);
        min = d3.min([min, data[key]]);
      }
    } */
      
    for (var key in data) {
      max = d3.max([max, data[key]]);
      min = d3.min([min, data[key]]);
    }

    if (max/min>10 || max>10000) useLogScale = true;
    if (max<1000) useLogScale = false;

    if (useLogScale) {
      min = 1; 
      max = Math.pow(10, Math.ceil(Math.log10(max)));
    } else {
      if (max == 1 || max == 0) {min = 0; max = 1;}
      if (min == max) {min = 0;}
      min = 0;
    }

    colorScaleLog.domain([min, max]);
    colorScaleLinear.domain([min, max]);

    legendScaleLog.domain([min, max]);
    legendScaleLinear.domain([min, max]);
    
    var colorScale = useLogScale ? colorScaleLog : colorScaleLinear;
    var legendScale = useLogScale ? legendScaleLog : legendScaleLinear;

    legendAxis.scale(legendScale);
    legendSvg.select(".axis")
      .transition()
      .call(legendAxis);
  }

  this.toggleBrush = function(b) {
    if (b) {
      svg.append("g")
        .attr("class", "brush")
        .call(brush);
    } else {
      svg.select(".brush").remove();
    }
  }

  this.toggleAutoLOD = function(b) {
    autoLOD = b;
  }

  this.toggleLogScale = function() {
    useLogScale = !useLogScale;
    updateColorScale(this.data);
    updateColor(this.data);
  }

  this.highlightBlock = function(str, color) {
    var array = partitionParser.list(str);
    highlightedElements = {};
    array.forEach(function(d) {
      highlightedElements[d] = color;
    });
    renderRects();
  }

  this.highlightLocation = function(str, color) {
    highlightedElements[str] = color;
    renderRects();
  }

  this.dehighlightLocation = function(str) {
    delete highlightedElements[str];
    renderRects();
  }

  this.updateData = function(data) {
    histogram = data;
    updateColorScale(data);
    renderRects();
  }

  this.resize = function(geom) {
    currentGeom = geom;
    const legendW = 40;
    
    width = geom.width - legendW;
    height = geom.height;

    const legendMargin = {top: 20, bottom: 20, right: 20, left: 10};
    const legendWidth = legendW - legendMargin.left - legendMargin.right,
          legendHeight = height - legendMargin.top - legendMargin.bottom;

    zoom.extent([[0, 0], [width, height]]);
      // .translateExtent([[0, 0], [width, height]])
    svg.call(zoom);
    
    brush.extent([[0, 0], [width, height]]);
    // svg.select(".brush").call(brush);

    canvas.style("left", geom.left)
      .style("top", geom.top)
      .attr("width", width)
      .attr("height", height);
    adjustCanvasResolution(canvas.node(), ctx);

    d3.select("#machineViewSvg")
      .style("left", geom.left)
      .style("top", geom.top)
      .attr("width", width)
      .attr("height", height);

    d3.select("#legendSvg")
      .style("left", geom.left + geom.width - legendW)
      .style("top", geom.top)
      .style("width", legendW)
      .style("height", height);

    legendSvg.attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top + ")");
    legendSvg.select("#legendRect")
      .attr("width", legendWidth)
      .attr("height", legendHeight);

    legendScaleLog.rangeRound([legendHeight, 0]);
    legendScaleLinear.rangeRound([legendHeight, 0]);

    var legendScale = useLogScale ? legendScaleLog : legendScaleLinear;
    legendAxis.scale(legendScale);
    legendSvg.select(".axis")
      // .attr("transform", "translate(" + legendWidth + ",0)")
      .call(legendAxis);

    renderRects();
  }
}
