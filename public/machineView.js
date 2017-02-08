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
  }
};

function machineView() {
  const L = 270, T = 10, W = 690, H = 306;
  const margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  const legendL = L+W, legendT = T, legendW = 40, legendH = H;
  const legendMargin = {top: 20, bottom: 20, right: 30, left: 0};
  const legendWidth = legendW - legendMargin.left - legendMargin.right,
        legendHeight = legendH - legendMargin.top - legendMargin.bottom;
  
  var useLogScale = true;
  
  var colorScaleLog = d3.scaleLog()
    .clamp(true)
    .range(["white", "steelblue"])
    .interpolate(d3.interpolateCubehelixLong);
  var colorScaleLinear = d3.scaleLinear()
    .clamp(true)
    .range(["white", "steelblue"]);

  var zoom = d3.zoom()
    .scaleExtent([1, 100])
    .on("zoom", zoomed);
  
  var brush = d3.brush()
    .on("end", brushed);

  var canvas = d3.select("#machineView")
    .append("canvas")
    .style("position", "absolute")
  var ctx = canvas.node().getContext("2d");
  
  var svg = d3.select("#machineView")
    .append("svg")
    .attr("class", "chart")
    .attr("id", "machineViewSvg")
    .append("g")
    .call(zoom);
  
  svg.append("g")
    .attr("class", "brush")
    .attr("id", "machineViewBrush")
    .call(brush);
  
  var legendSvg = d3.select("#machineViewLegend").append("svg")
    .attr("class", "chart")
    .style("left", legendL)
    .style("top", legendT)
    .attr("width", legendW)
    .attr("height", legendH)
    .append("g")
    .attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top + ")");
  
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
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)");

  legendSvg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + legendWidth + ",0)");
  
  var legendScaleLog = d3.scaleLog()
    .rangeRound([legendHeight, 0]);
  var legendScaleLinear = d3.scaleLinear()
    .rangeRound([legendHeight, 0]);

  var rects = [];
  var histogram = {};
  var highlightedElements = {};
  var highlightColor;
  var currentTransform = {x: 0, y: 0, k: 1};
  
  var autoLOD = true;
  var previousLOD = 2, currentLOD = 2;

  d3.csv("/machine.csv", function(err, data) {
    data.forEach(function(d) {
      d.lod = +d.lod;
      d.x = +d.x;
      d.y = +d.y;
      d.w = +d.w;
      d.h = +d.h;
    });
    rects = data;
    ctx.clearRect(0, 0, W, H);
    renderRects();
  });

  function renderRects() {
    var colorScale = useLogScale ? colorScaleLog : colorScaleLinear;
   
    var box = {
      x: -currentTransform.x / currentTransform.k,
      y: -currentTransform.y / currentTransform.k,
      w: W / currentTransform.k,
      h: H / currentTransform.k
    };
    
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(currentTransform.x, currentTransform.y);
    ctx.scale(currentTransform.k, currentTransform.k);
    rects.forEach(function(d) {
      if (d.lod >= currentLOD && aabb.collide(box, d)) {
        if (d.id in histogram) ctx.fillStyle = colorScale(histogram[d.id]); // TODO
        else ctx.fillStyle = "white";

        if (d.id in highlightedElements) {
          ctx.shadowColor = highlightColor;
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowBlur = 0;
        };
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.shadowBlur = 0;
       
        if (d.lw > 0) {
          ctx.lineWidth = d.lw;
          ctx.strokeRect(d.x, d.y, d.w, d.h);
        }

        if (d.ts > 0) {
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

  function zoomed() {
    var t = d3.event.transform;
    currentTransform = {k: t.k, x: t.x, y: t.y};

    if (autoLOD) {
      if (t.k >= 8) setLOD(0);
      else if (t.k >= 3) setLOD(1);
      else setLOD(2);
      renderRects();
    } else
      renderRects();
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
      if (matched.length > 0) {
        query["location"] = matched;
        refresh();
      }
    } else {
      delete query["location"];
      refresh();
    }
  }
  
  function updateColorScale(data) {
    var min = 1e12; max = 0;
    for (var key in data) {
      max = d3.max([max, data[key]]);
      min = d3.min([min, data[key]]);
    }

    // console.log(min, max);

    if (max/min>10 || max>10000) useLogScale = true;
    if (max<1000) useLogScale = false;

    if (useLogScale) {
      min = 1; 
      max = Math.pow(10, Math.ceil(Math.log10(max)));
    } else {
      if (max == 1 || max == 0) {min = 0; max = 1;}
      if (min == max) {min = 0;}
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

  this.toggleAutoLOD = function(b) {
    autoLOD = b;
  }

  this.toggleLogScale = function() {
    useLogScale = !useLogScale;
    updateColorScale(this.data);
    updateColor(this.data);
  }

  this.highlightBlock = function(str, color) {
    highlightColor = color;
    var array = partitionParser.list(str);
    highlightedElements = {};
    array.forEach(function(d) {
      highlightedElements[d] = 1;
    });
    renderRects();
  }

  this.updateData = function(data) {
    histogram = data;
    updateColorScale(data);
    renderRects();
  }

  this.resize = function(geom) {
    zoom.translateExtent([[0, 0], [W, H]])
      .extent([[0, 0], [W, H]]);
    
    brush.extent([[0, 0], [W, H]]);

    canvas.style("left", L)
      .style("top", T)
      .attr("width", W)
      .attr("height", H);
    adjustCanvasResolution(canvas.node(), ctx);

    d3.select("#machineViewSvg")
      .style("left", L)
      .style("top", T)
      .attr("width", W)
      .attr("height", H);
  }
}
