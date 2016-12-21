function renderMachinesL2() {

}

function machineView() {
  const L = 270, T = 25, W = 690, H = 300;
  const margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  const rackW = 34, rackH = 96, rackPadding = 2;
 
  const midplaneGroupL = 2, midplaneGroupT = 12;
  const midplaneW = 30, midplaneH = 40, midplanePadding = 2;
 
  const nodeBoardGroupL = 0, nodeBoardGroupT = 10, nodeBoardGroupW = 30, nodeBoardGroupH = 30;
  const nodeBoardW = nodeBoardGroupW/4, nodeBoardH = nodeBoardGroupH/4;

  const computeCardGroupL = 0, computeCardGroupT = 0, computeCardGroupW = nodeBoardW/2, computeCardGroupH = nodeBoardH/2;
  const computeCardW = computeCardGroupW/4, computeCardH = computeCardGroupH/4;

  const ioDrawerGroupL = 2, ioDrawerGroupT = 12, ioDrawerGroupW = 30, ioDrawerGroupH = 82;
  const ioDrawerW = ioDrawerGroupW/3, ioDrawerH = ioDrawerGroupH/3;

  const legendL = L+W, legendT = T, legendW = 40, legendH = H;
  const legendMargin = {top: 20, bottom: 20, right: 30, left: 0};
  const legendWidth = legendW - legendMargin.left - legendMargin.right,
        legendHeight = legendH - legendMargin.top - legendMargin.bottom;

  var zoom = d3.zoom()
    .scaleExtent([1, 160])
    .translateExtent([[0, 0], [W, H]])
    .on("zoom", zoomed);

  var svg = d3.select("#machineView").append("svg")
    .attr("class", "chart")
    .style("left", L)
    .style("top", T)
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("id", "machineViewSvg")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

  for (i=0; i<3; i++) {
    var row = svg.append("g")
      .attr("class", "row")
      .attr("transform", "translate(0," + (rackH+rackPadding*2)*i + ")")
    for (j=0; j<16; j++) {
      var rackStr = rack2str(i, j);
      var rack = row.append("g")
        .attr("transform", "translate(" + ((rackW+rackPadding*2)*j + rackPadding) + "," + rackPadding + ")");
      rack.append("rect")
        .attr("class", "c rackBox")
        .attr("id", rackStr)
        .attr("title", rackStr)
        .attr("width", rackW)
        .attr("height", rackH);
      rack.append("text")
        .attr("class", "rackID")
        .attr("x", rackW/2)
        .attr("y", 10)
        .text(rackStr);

      var midplaneGroup = rack.append("g")
        .attr("transform", "translate(" + midplaneGroupL + "," + midplaneGroupT + ")");

      for (k=0; k<2; k++) {
        var midplaneStr = midplane2str(i, j, k);
        var midplane = midplaneGroup.append("g")
          .attr("id", midplane2str(i, j, k))
          .attr("transform", "translate(0," + (midplaneH+midplanePadding)*k + ")");
        midplane.append("rect")
          .attr("class", "c midplaneBox")
          .attr("id", midplaneStr)
          .attr("title", midplaneStr)
          .attr("width", midplaneW)
          .attr("height", midplaneH);
        midplane.append("text")
          .attr("class", "midplaneID")
          .attr("title", midplaneStr)
          .attr("x", midplaneW/2)
          .attr("y", 9)
          .text("M" + k)

        var nodeBoardGroup = midplane.append("g")
          .attr("transform", "translate(" + nodeBoardGroupL + "," + nodeBoardGroupT + ")");

        for (p=0; p<4; p++) {
          for (q=0; q<4; q++) {
            var nodeBoardID = p*4+q;
            var nodeBoardStr = nodeBoard2str(i, j, k, nodeBoardID);
            var nodeBoard = nodeBoardGroup.append("g")
              .attr("id", nodeBoard2str(i, j, k, nodeBoardID))
              .attr("transform", "translate(" + q*nodeBoardW + "," + p*nodeBoardH + ")");
            nodeBoard.append("rect")
              .attr("class", "c nodeBoardBox")
              .attr("id", nodeBoardStr)
              .attr("title", nodeBoardStr)
              .attr("width", nodeBoardW)
              .attr("height", nodeBoardH);
            /*
            nodeBoard.append("text")
              .attr("class", "nodeBoardID")
              .attr("x", nodeBoardW/2)
              .attr("y", 1)
              .text("N" + pad(nodeBoardID, 10, 2)) */
          }
        }
      }
    }

    for (j=16; j<18; j++) {
      var ioRackStr = ioRack2str(i, j);
      var ioRack = row.append("g")
        .attr("id", ioRackStr)
        .attr("transform", "translate(" + ((rackW+rackPadding*2)*j + rackPadding) + "," + rackPadding + ")");
      ioRack.append("rect")
        .attr("class", "c rackBox")
        .attr("id", ioRackStr)
        .attr("title", ioRackStr)
        .attr("width", rackW)
        .attr("height", rackH);
      ioRack.append("text")
        .attr("class", "rackID")
        .attr("title", ioRackStr)
        .attr("x", rackW/2)
        .attr("y", 10)
        .text(ioRackStr);

      var ioDrawerGroup = ioRack.append("g")
        .attr("transform", "translate(" + ioDrawerGroupL + "," + ioDrawerGroupT + ")");

      for (p=0; p<3; p++) {
        for (q=0; q<3; q++) {
          var ioDrawerID = p*3+q;
          var ioDrawerStr = ioDrawer2str(i, j, ioDrawerID);
          ioDrawerGroup.append("rect")
            .attr("class", "c ioDrawerBox")
            .attr("id", ioDrawerStr)
            .attr("title", ioDrawerStr)
            .attr("width", ioDrawerW)
            .attr("height", ioDrawerH)
            .attr("transform", "translate(" + q*ioDrawerW + "," + p*ioDrawerH + ")");
        }
      }
    }
  }

  var brush = d3.brush()
    .extent([[0, 0], [W, H]])
    .on("end", brushed);
  svg.append("g")
    .attr("class", "brush")
    .attr("id", "machineViewBrush").call(brush);

  $(".c").tooltip();

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

  var useLogScale = true;
  
  var colorScaleLog = d3.scaleLog()
    .clamp(true)
    .range(["white", "steelblue"])
    .interpolate(d3.interpolateCubehelixLong);
  var colorScaleLinear = d3.scaleLinear()
    .clamp(true)
    .range(["white", "steelblue"]);
  
  var legendScaleLog = d3.scaleLog()
    .rangeRound([legendHeight, 0]);
  var legendScaleLinear = d3.scaleLinear()
    .rangeRound([legendHeight, 0]);

  this.toggleLogScale = function() {
    useLogScale = !useLogScale;
    updateColorScale(this.data);
    updateColor(this.data);
  }

  function updateColor(data) {
    var colorScale = useLogScale ? colorScaleLog : colorScaleLinear;

    $(".c").each(function() {
      var id = $(this).attr("id");
      var val = data[id];
      var color = val == undefined ? colorScale(0) : colorScale(val);
      $(this).css("fill", color);
    });

    /* // also works
    d3.selectAll(".c").each(function(d){
      var _this = d3.select(this);
      var _id = _this.attr("id");
      var color; 
      if (data[_id] == undefined) color = scale(0);
      else color = scale(data[_id]);
      _this.style("fill", color);
    }); */
  }

  function updateColorScale(data) {
    var min, max;

    if (useLogScale) {
      min = 1; max = 10;
      for (var key in data) {max = d3.max([max, data[key]]);}
      max = Math.pow(10, Math.ceil(Math.log10(max)));
    } else {
      min = 1e12; max = 0;
      for (var key in data) {
        max = d3.max([max, data[key]]);
        min = d3.min([min, data[key]]);
      }

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

  this.updateData = function(data) {
    this.data = data;
    updateColorScale(data);
    updateColor(data);
  }

  function brushed() {
    var s = d3.event.selection;
    if (s != null) {
      var locations = [];
      var b0 = $("#machineViewBrush > .selection")[0].getBoundingClientRect();
      $(".c").filter(function() {
        var b = $(this)[0].getBoundingClientRect();
        var x = b.left, y = b.top;
        return x>=b0.left && x<=b0.right && y>=b0.top && y<=b0.bottom;
      }).each(function() {
        locations.push($(this).attr("id"));
      });
      if (locations.length > 0) {
        query["location"] = locations;
        refresh();
      }
    } else {
      delete query["location"];
      refresh();
    }
  }

  function zoomed() {
    svg.attr("transform", d3.event.transform);
    // console.log("zoomed");
  }

  this.reset = function() {
    svg.select(".brush")
      .call(brush.move, null)
      .call(zoom.transform, d3.zoomIdentity);
  }
}

function highlightBlockAndLocation(block, location) {
  highlightBlock(block);
  highlightNodeBoard(location);
}

function highlightBlock(str) {
  var set = parseComputeBlock(str);
  $(".c").css("fill", "white");
  $(".c").filter(function() {
    var mpStr = $(this).attr("id").slice(0, 6);
    return set.has(mpStr);
  }).css("fill", "darkblue");
}

function highlightNodeBoard(str) {
  var nodeBoardStr = locationStrToNodeBoardStr(str);
  $(".c#" + nodeBoardStr).css("fill", "red");
}

// createMachineView();
// highlightBlock("MIR-00000-73FF1-16384");
