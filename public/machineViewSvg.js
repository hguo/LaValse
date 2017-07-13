var AABB = {
  collide: function (el1, el2) {
    var rect1 = el1.getBoundingClientRect();
    var rect2 = el2.getBoundingClientRect();

    return !(
      rect1.top > rect2.bottom ||
      rect1.right < rect2.left ||
      rect1.bottom < rect2.top ||
      rect1.left > rect2.right
    );
  },

  inside: function (el1, el2) {
    var rect1 = el1.getBoundingClientRect();
    var rect2 = el2.getBoundingClientRect();
    console.log(el1, el2);

    return (
      ((rect2.top <= rect1.top) && (rect1.top <= rect2.bottom)) &&
      ((rect2.top <= rect1.bottom) && (rect1.bottom <= rect2.bottom)) &&
      ((rect2.left <= rect1.left) && (rect1.left <= rect2.right)) &&
      ((rect2.left <= rect1.right) && (rect1.right <= rect2.right))
    );
  }
};

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

  const computeCardGroupL = 0, computeCardGroupT = 1.5;
  const computeCardW = 0.9375, computeCardH = 0.9375;

  const linkModuleGroupL = 0, linkModuleGroupT = 5.25;
  const linkModuleW = 1.25, linkModuleH = 1.25;

  const opticalModuleGroupL = 3.75, opticalModuleGroupT = 5.25;
  const opticalModuleW = 0.625, opticalModuleH = 0.625;

  const DCAGroupL = 3.75, DCAGroupT = 0.25;
  const DCAW = 1.75, DCAH = 1;

  const ioDrawerGroupL = 2, ioDrawerGroupT = 12, ioDrawerGroupW = 30, ioDrawerGroupH = 82;
  const ioDrawerW = ioDrawerGroupW/3, ioDrawerH = ioDrawerGroupH/3;

  const bulkPowerSupplyGroupL = 19.75, bulkPowerSupplyGroupT = 2;
  const bulkPowerSupplyW = 3, bulkPowerSupplyH = 3;

  const powerModuleGroupL = 0, powerModuleGroupT = 0;
  const powerModuleW = 1, powerModuleH = 1;

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
    .attr("id", "machineViewSvg")
    .style("left", L)
    .style("top", T)
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

  renderMachinesL4();
  renderMachinesL3();
  renderMachinesL2();
  // renderMachinesL1();
  // renderMachinesL0();
  // $(".L1").remove();
  // $(".L0").remove();

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

  var zoomTimer = d3.timer(function() {zoomTimer.stop();});
  var currentZoom = 1.0;

  function zoomed() {
    svg.attr("transform", d3.event.transform);
    zoom = d3.event.transform.k;
    zoomTimer.restart(zoomTimedOut, 300);
  }

  function zoomTimedOut() {
    // console.log("zoomed", zoom);
    zoomTimer.stop();
    updateZoom(zoom);
  }

  function updateZoom(zoom) {
    if (zoom > 6) targetLOD = 0;
    else if (zoom > 2) targetLOD = 1;
    else targetLOD = 2;

    updateLOD(targetLOD);
  }

  function updateLOD(targetLOD) {
    if (currentLOD == 2) {
      if (targetLOD == 1) {
        renderMachinesL1();
      } else if (targetLOD == 0) {
        renderMachinesL1();
        renderMachinesL0();
      }
    }
    if (currentLOD == 1) {
      if (targetLOD == 2) {
        $(".L1").remove();
      } else if (targetLOD == 0) {
        renderMachinesL0();
      }
    }
    if (currentLOD == 0) {
      if (targetLOD == 1) {
        $(".L0").remove();
      } else if (targetLOD == 2) {
        $(".L0").remove();
        $(".L1").remove();
      }
    }

    currentLOD = targetLOD;
  }

  this.reset = function() {
    svg.select(".brush")
      .call(brush.move, null)
      .call(zoom.transform, d3.zoomIdentity);
  }

  function renderMachinesL4() {
    renderRacks(svg);
  }

  function renderMachinesL3() {
    $("#machineView .R").each(function() {
      renderMidplanes(d3.select(this));
    });
  }

  function renderMachinesL2() {
    $("#machineView .Q").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderIODrawers(d3.select(this));
    });

    $("#machineView .RM").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderNodeBoards(d3.select(this));
    });
  }

  function renderMachinesL1() {
    $("#machineView .R").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderBulkPowerSupply(d3.select(this));
      renderClockCard(d3.select(this));
      renderCoolantMonitor(d3.select(this));
    });

    $("#machineView .RM").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderServiceCard(d3.select(this));
    });
  }

  function renderMachinesL0() {
    $("#machineView .RMN").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderComputeCards(d3.select(this));
      renderLinkModules(d3.select(this));
      renderOpticalModules(d3.select(this));
      renderDCAs(d3.select(this));
    });

    $("#machineView .RB").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderPowerModules(d3.select(this));
    });
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
          .attr("class", "R L4")
          .attr("_row", row)
          .attr("_col", col);
        rack.append("rect")
          .attr("class", "c RBox")
          .attr("id", rackStr)
          .attr("title", rackStr)
          .attr("width", rackW)
          .attr("height", rackH);
        rack.append("text")
          .attr("class", "RID")
          .attr("x", 2)
          .attr("y", 8)
          .text(rackStr);
      }

      for (col=16; col<18; col++) {
        var ioRackStr = ioRack2str(row, col);
        var ioRack = rowGroup.append("g")
          .attr("transform", "translate(" + ((rackW+rackPadding*2)*col + rackPadding) + "," + rackPadding + ")")
          .attr("class", "Q L4")
          .attr("_row", row)
          .attr("_col", col);
        ioRack.append("rect")
          .attr("class", "c QBox")
          .attr("id", ioRackStr)
          .attr("title", ioRackStr)
          .attr("width", rackW)
          .attr("height", rackH);
        ioRack.append("text")
          .attr("class", "QID")
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
      .attr("transform", "translate(" + midplaneGroupL + "," + midplaneGroupT + ")")
      .attr("class", "L3");

    for (mp=0; mp<2; mp++) {
      var midplaneStr = midplane2str(row, col, mp);
      var midplaneIdx = (row*16+col)*2+mp;
      var midplane = midplaneGroup.append("g")
        .attr("id", midplaneStr)
        .attr("transform", "translate(0," + (midplaneH+midplanePadding)*mp + ")")
        .attr("class", "RM")
        .attr("_row", row)
        .attr("_col", col)
        .attr("_mp", mp);
      midplane.append("rect")
        .attr("class", "c RMBox")
        .attr("_mpi", midplaneIdx)
        .attr("id", midplaneStr)
        .attr("title", midplaneStr)
        .attr("width", midplaneW)
        .attr("height", midplaneH);
      midplane.append("text")
        .attr("class", "RMID")
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
      .attr("transform", "translate(" + ioDrawerGroupL + "," + ioDrawerGroupT + ")")
      .attr("class", "L2");

    for (p=0; p<3; p++) {
      for (q=0; q<3; q++) {
        var ioDrawerID = p*3+q;
        var ioDrawerStr = ioDrawer2str(row, col, ioDrawerID);
        ioDrawerGroup.append("rect")
          .attr("class", "c QIBox")
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
      .attr("transform", "translate(" + nodeBoardGroupL + "," + nodeBoardGroupT + ")")
      .attr("class", "L2");

    for (p=0; p<4; p++) {
      for (q=0; q<4; q++) {
        var nodeBoardID = p*4+q;
        var nodeBoardStr = nodeBoard2str(row, col, mp, nodeBoardID);
        var nodeBoard = nodeBoardGroup.append("g")
          .attr("id", nodeBoardStr)
          .attr("transform", "translate(" + q*nodeBoardW + "," + p*nodeBoardH + ")")
          .attr("class", "RMN")
          .attr("_row", row)
          .attr("_col", col)
          .attr("_mp", mp)
          .attr("_nb", nodeBoardID);
        nodeBoard.append("rect")
          .attr("class", "c RMNBox")
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
      .attr("transform", "translate(" + bulkPowerSupplyGroupL + "," + bulkPowerSupplyGroupT + ")")
      .attr("class", "L1")

    for (p=0; p<2; p++) {
      for (q=0; q<2; q++) {
        var bulkPowerSupplyID = p*2+q;
        var bulkPowerSupplyStr = bulkPowerSupply2str(row, col, bulkPowerSupplyID);
        var bulkPowerSupply = bulkPowerSupplyGroup.append("g")
          .attr("id", bulkPowerSupplyStr)
          .attr("transform", "translate(" + q*bulkPowerSupplyW + "," + p*bulkPowerSupplyH + ")")
          .attr("class", "RB")
          .attr("_row", row)
          .attr("_col", col)
          .attr("_bps", bulkPowerSupplyID);
        bulkPowerSupply.append("rect")
          .attr("class", "c RBBox")
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
      .attr("class", "RK L1");
    clockCard.append("rect")
      .attr("class", "c RKBox")
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
      .attr("class", "RL L1");
    coolantMonitor.append("rect")
      .attr("class", "c RLBox")
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
      .attr("class", "RMS L1");
    serviceCard.append("rect")
      .attr("class", "c RMSBox")
      .attr("id", serviceCardStr)
      .attr("width", serviceCardW)
      .attr("height", serviceCardH);
  }

  function renderComputeCards(nodeBoard) {
    var row = +nodeBoard.attr("_row");
    var col = +nodeBoard.attr("_col");
    var mp = +nodeBoard.attr("_mp");
    var nb = +nodeBoard.attr("_nb");

    var computeCardGroup = nodeBoard.append("g")
      .attr("transform", "translate(" + computeCardGroupL + "," + computeCardGroupT + ")")
      .attr("class", "L0");

    for (p=0; p<4; p++) {
      for (q=0; q<8; q++) {
        var computeCardID = p*8+q;
        var computeCardStr = computeCard2str(row, col, mp, nb, computeCardID);
        var computeCard = computeCardGroup.append("g")
          .attr("id", computeCardStr)
          .attr("transform", "translate(" + q*computeCardW + "," + p*computeCardH + ")")
          .attr("class", "RMNJ");
        computeCard.append("rect")
          .attr("class", "c RMNJBox")
          .attr("id", computeCardStr)
          .attr("width", computeCardW)
          .attr("height", computeCardH);
        /* computeCard.append("text")
          .attr("class", "c RMNJText")
          .attr("x", 0)
          .attr("y", 0)
          .text("J" + pad(computeCardID, 10, 2));*/
      }
    }
  }

  function renderLinkModules(nodeBoard) {
    var row = +nodeBoard.attr("_row");
    var col = +nodeBoard.attr("_col");
    var mp = +nodeBoard.attr("_mp");
    var nb = +nodeBoard.attr("_nb");

    var linkModuleGroup = nodeBoard.append("g")
      .attr("transform", "translate(" + linkModuleGroupL + "," + linkModuleGroupT + ")")
      .attr("class", "L0");

    for (p=0; p<3; p++) {
      for (q=0; q<3; q++) {
        var linkModuleID = p*3+q;
        var linkModuleStr = linkModule2str(row, col, mp, nb, linkModuleID);
        var linkModule = linkModuleGroup.append("g")
          .attr("id", linkModuleStr)
          .attr("transform", "translate(" + q*linkModuleW + "," + p*linkModuleH + ")")
          .attr("class", "RMNU");
        linkModule.append("rect")
          .attr("class", "c RMNUBox")
          .attr("id", linkModuleStr)
          .attr("width", linkModuleW)
          .attr("height", linkModuleH);
      }
    }
  }

  function renderOpticalModules(nodeBoard) {
    var row = +nodeBoard.attr("_row");
    var col = +nodeBoard.attr("_col");
    var mp = +nodeBoard.attr("_mp");
    var nb = +nodeBoard.attr("_nb");

    var opticalModuleGroup = nodeBoard.append("g")
      .attr("transform", "translate(" + opticalModuleGroupL + "," + opticalModuleGroupT + ")")
      .attr("class", "L0");

    for (p=0; p<6; p++) {
      for (q=0; q<6; q++) {
        var opticalModuleID = p*6+q;
        var opticalModuleStr = opticalModule2str(row, col, mp, nb, opticalModuleID);
        var opticalModule = opticalModuleGroup.append("g")
          .attr("id", opticalModuleStr)
          .attr("transform", "translate(" + q*opticalModuleW + "," + p*opticalModuleH + ")")
          .attr("class", "RMNO");
        opticalModule.append("rect")
          .attr("class", "c RMNOBox")
          .attr("id", opticalModuleStr)
          .attr("width", opticalModuleW)
          .attr("height", opticalModuleH);
      }
    }
  }

  function renderDCAs(nodeBoard) {
    var row = +nodeBoard.attr("_row");
    var col = +nodeBoard.attr("_col");
    var mp = +nodeBoard.attr("_mp");
    var nb = +nodeBoard.attr("_nb");

    var DCAGroup = nodeBoard.append("g")
      .attr("transform", "translate(" + DCAGroupL + "," + DCAGroupT + ")")
      .attr("class", "L0");

    for (p=0; p<2; p++) {
      var DCAID = p;
      var DCAStr = DCA2str(row, col, mp, nb, DCAID);
      var DCA = DCAGroup.append("g")
        .attr("id", DCAStr)
        .attr("transform", "translate(" + p*DCAW + ",0)")
        .attr("class", "RMND");
      DCA.append("rect")
        .attr("class", "c RMNDBox")
        .attr("id", DCAStr)
        .attr("width", DCAW)
        .attr("height", DCAH);
    }
  }

  function renderPowerModules(bulkPowerSupply) {
    var row = +bulkPowerSupply.attr("_row");
    var col = +bulkPowerSupply.attr("_col");
    var bps = +bulkPowerSupply.attr("_bps");

    var powerModuleGroup = bulkPowerSupply.append("g")
      .attr("transform", "translate(" + powerModuleGroupL + "," + powerModuleGroupT + ")")
      .attr("class", "L0");

    for (p=0; p<3; p++) {
      for (q=0; q<3; q++) {
        var powerModuleID = p*3+q;
        var powerModuleStr = powerModule2str(row, col, bps, powerModuleID);
        var powerModule = powerModuleGroup.append("g")
          .attr("id", powerModuleStr)
          .attr("transform", "translate(" + q*powerModuleW + "," + p*powerModuleH + ")")
          .attr("class", "RMND L0");
        powerModule.append("rect")
          .attr("class", "c RMNDBox")
          .attr("id", powerModuleStr)
          .attr("width", powerModuleW)
          .attr("height", powerModuleH);
      }
    }
  }
}

function highlightBlock(str, color) {
  var array = partitionParser.parse(str);
  $(".RMBox").css("stroke", "").css("stroke-width", "");
  $(".RMBox").filter(function() {
    var idx = +($(this).attr("_mpi"));
    return array[idx];
  }).css("stroke", color).css("stroke-width", 2);
}

function highlightNodeBoard(str, color) { 
  var nodeBoardStr = locationStrToNodeBoardStr(str);
  $(".RMNBox").css("stroke", "").css("stroke-width", "");
  $(".c#" + nodeBoardStr)
    .css("stroke", color)
    .css("stroke-width", 2);
}

function highlightBlockAndLocation(block, location) { // LEGACY
  highlightBlock(block);
  highlightNodeBoard(location);
}

// createMachineView();
// highlightBlock("MIR-00000-73FF1-16384");
