function machineView() {
  const L = 270, T = 25, W = 690, H = 306;
  const margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  
  const rackW = 34, rackH = 96, rackPadding = 2;
 
  const midplaneGroupL = 2, midplaneGroupT = 10;
  const midplaneW = 30, midplaneH = 41, midplanePadding = 2;
 
  const nodeBoardGroupL = 0, nodeBoardGroupT = 5, nodeBoardGroupW = 30, nodeBoardGroupH = 30;
  const nodeBoardW = 7.5, nodeBoardH = 9;

  const judoGroupL = 0, judoGroupT = 1.5, judoGroupW = 7.5, judoGroupH = 7.5;

  const computeCardGroupL = 0, computeCardGroupT = 0, computeCardGroupW = judoGroupW/2, computeCardGroupH = judoGroupH/2;
  const computeCardW = computeCardGroupW/8, computeCardH = computeCardGroupH/4;

  const ioDrawerGroupL = 2, ioDrawerGroupT = 12, ioDrawerGroupW = 30, ioDrawerGroupH = 82;
  const ioDrawerW = ioDrawerGroupW/3, ioDrawerH = ioDrawerGroupH/3;

  const bulkPowerSupplyGroupL = 19.75, bulkPowerSupplyGroupT = 2;
  const bulkPowerSupplyW = 3, bulkPowerSupplyH = 3;

  const clockCardL = 25.75, clockCardT = 2;
  const clockCardW = 3, clockCardH = 6;

  const coolantMonitorL = 28.75, coolantMonitorT = 2;
  const coolantMonitorW = 3, coolantMonitorH = 6;

  const serviceCardL = 21, serviceCardT = 1;
  const serviceCardW = 8, serviceCardH = 3;

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

  renderMachinesL4();
  renderMachinesL3();
  renderMachinesL2();
  // renderMachinesL1();

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

  function updateLOD(currentLevel) {
    // remove 
  }

  function renderMachinesL4() {
    renderRacks(svg);
  }

  function renderMachinesL3() {
    $("#machineView .rack").each(function() {
      renderMidplanes(d3.select(this));
    });
  }

  function renderMachinesL2(svg) {
    $("#machineView .ioRack").each(function() {
      renderIODrawers(d3.select(this));
    })

    $("#machineView .midplane").each(function() {
      renderNodeBoards(d3.select(this));
    })
  }

  function renderMachinesL1(parent) {
    $("#machineView .rack").each(function() {
      renderBulkPowerSupply(d3.select(this));
      renderClockCard(d3.select(this));
      renderCoolantMonitor(d3.select(this));
    });

    $("#machineView .midplane").each(function() {
      renderServiceCard(d3.select(this));
    })
  }

  function renderRacks(parent) {
    for (row=0; row<3; row++) {
      var rowGroup = parent.append("g")
        .attr("class", "row")
        .attr("transform", "translate(0," + (rackH+rackPadding*2)*row + ")")
      for (col=0; col<16; col++) {
        var rackStr = rack2str(row, col);
        var rack = rowGroup.append("g")
          .attr("transform", "translate(" + ((rackW+rackPadding*2)*col + rackPadding) + "," + rackPadding + ")")
          .attr("class", "rack")
          .attr("_row", row)
          .attr("_col", col);
        rack.append("rect")
          .attr("class", "c rackBox")
          .attr("id", rackStr)
          .attr("title", rackStr)
          .attr("width", rackW)
          .attr("height", rackH);
        rack.append("text")
          .attr("class", "rackID")
          .attr("x", 2)
          .attr("y", 8)
          .text(rackStr);
      }

      for (col=16; col<18; col++) {
        var ioRackStr = ioRack2str(row, col);
        var ioRack = rowGroup.append("g")
          .attr("transform", "translate(" + ((rackW+rackPadding*2)*col + rackPadding) + "," + rackPadding + ")")
          .attr("class", "ioRack")
          .attr("_row", row)
          .attr("_col", col);
        ioRack.append("rect")
          .attr("class", "c rackBox")
          .attr("id", ioRackStr)
          .attr("title", ioRackStr)
          .attr("width", rackW)
          .attr("height", rackH);
        ioRack.append("text")
          .attr("class", "rackID")
          .attr("title", ioRackStr)
          .attr("x", 2)
          .attr("y", 8)
          .text(ioRackStr);
      }
    }
  }

  function renderMidplanes(rack) {
    var row = +rack.attr("_row");
    var col = +rack.attr("_col");

    var midplaneGroup = rack.append("g")
      .attr("transform", "translate(" + midplaneGroupL + "," + midplaneGroupT + ")");

    for (mp=0; mp<2; mp++) {
      var midplaneStr = midplane2str(row, col, mp);
      var midplane = midplaneGroup.append("g")
        .attr("id", midplaneStr)
        .attr("transform", "translate(0," + (midplaneH+midplanePadding)*mp + ")")
        .attr("class", "midplane")
        .attr("_row", row)
        .attr("_col", col)
        .attr("_mp", mp);
      midplane.append("rect")
        .attr("class", "c midplaneBox")
        .attr("id", midplaneStr)
        .attr("title", midplaneStr)
        .attr("width", midplaneW)
        .attr("height", midplaneH);
      midplane.append("text")
        .attr("class", "midplaneID")
        .attr("title", midplaneStr)
        .attr("x", 2)
        .attr("y", 4)
        .text(midplaneStr);
    }
  }

  function renderIODrawers(ioRack) {
    var row = +ioRack.attr("_row");
    var col = +ioRack.attr("_col");

    var ioDrawerGroup = ioRack.append("g")
      .attr("transform", "translate(" + ioDrawerGroupL + "," + ioDrawerGroupT + ")");

    for (p=0; p<3; p++) {
      for (q=0; q<3; q++) {
        var ioDrawerID = p*3+q;
        var ioDrawerStr = ioDrawer2str(row, col, ioDrawerID);
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

  function renderNodeBoards(midplane) {
    var row = +midplane.attr("_row");
    var col = +midplane.attr("_col");
    var mp = +midplane.attr("_mp");

    var nodeBoardGroup = midplane.append("g")
      .attr("transform", "translate(" + nodeBoardGroupL + "," + nodeBoardGroupT + ")");

    for (p=0; p<4; p++) {
      for (q=0; q<4; q++) {
        var nodeBoardID = p*4+q;
        var nodeBoardStr = nodeBoard2str(row, col, mp, nodeBoardID);
        var nodeBoard = nodeBoardGroup.append("g")
          .attr("id", nodeBoardStr)
          .attr("transform", "translate(" + q*nodeBoardW + "," + p*nodeBoardH + ")")
          .attr("class", "nodeBoard")
          .attr("_row", row)
          .attr("_col", col)
          .attr("_mp", mp)
          .attr("_nb", nodeBoardID);
        nodeBoard.append("rect")
          .attr("class", "c nodeBoardBox")
          .attr("id", nodeBoardStr)
          .attr("title", nodeBoardStr)
          .attr("width", nodeBoardW)
          .attr("height", nodeBoardH);
      }
    }
  }

  function renderBulkPowerSupply(rack) {
    var row = +rack.attr("_row");
    var col = +rack.attr("_col");

    var bulkPowerSupplyGroup = rack.append("g")
      .attr("transform", "translate(" + bulkPowerSupplyGroupL + "," + bulkPowerSupplyGroupT + ")");

    for (p=0; p<2; p++) {
      for (q=0; q<2; q++) {
        var bulkPowerSupplyID = p*2+q;
        var bulkPowerSupplyStr = bulkPowerSupply2str(row, col, bulkPowerSupplyID);
        var bulkPowerSupply = bulkPowerSupplyGroup.append("g")
          .attr("id", bulkPowerSupplyStr)
          .attr("transform", "translate(" + q*bulkPowerSupplyW + "," + p*bulkPowerSupplyH + ")")
          .attr("class", "L1 RB")
          .attr("_row", row)
          .attr("_col", col)
          .attr("_bulkPowerSupply", bulkPowerSupplyID);
        bulkPowerSupply.append("rect")
          .attr("class", "c bulkPowerSupplyBox")
          .attr("id", bulkPowerSupplyStr)
          .attr("width", bulkPowerSupplyW)
          .attr("height", bulkPowerSupplyH);
      }
    }
  }

  function renderClockCard(rack) {
    var row = +rack.attr("_row");
    var col = +rack.attr("_col");

    var clockCardStr = clockCard2str(row, col);
    var clockCard = rack.append("g")
      .attr("transform", "translate(" + clockCardL + "," + clockCardT + ")")
      .attr("class", "L1 RK");
    clockCard.append("rect")
      .attr("class", "c clockCardBox")
      .attr("id", clockCardStr)
      .attr("width", clockCardW)
      .attr("height", clockCardH);
  }

  function renderCoolantMonitor(rack) {
    var row = +rack.attr("_row");
    var col = +rack.attr("_col");

    var coolantMonitorStr = coolantMonitor2str(row, col);
    var coolantMonitor = rack.append("g")
      .attr("transform", "translate(" + coolantMonitorL + "," + coolantMonitorT + ")")
      .attr("class", "L1 RL");
    coolantMonitor.append("rect")
      .attr("class", "c coolantMonitorBox")
      .attr("id", coolantMonitorStr)
      .attr("width", coolantMonitorW)
      .attr("height", coolantMonitorH);
  }

  function renderServiceCard(midplane) {
    var row = +midplane.attr("_row");
    var col = +midplane.attr("_col");
    var mp = +midplane.attr("_mp");

    var serviceCardStr = serviceCard2str(row, col, mp);
    var serviceCard = midplane.append("g")
      .attr("transform", "translate(" + serviceCardL + "," + serviceCardT + ")")
      .attr("class", "L1 RMS");
    serviceCard.append("rect")
      .attr("class", "c serviceCardBox")
      .attr("id", serviceCardStr)
      .attr("width", serviceCardW)
      .attr("height", serviceCardH);
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
