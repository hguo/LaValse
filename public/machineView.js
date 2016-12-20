function machineView() {
  const L = 270, T = 25, W = 690, H = 258;
  const margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  const rackW = 34, rackH = 81, rackPadding = 2;
  const midplaneW = 30, midplaneH = 30, midplaneTop = 15, midplanePadding = 2;
  const nodeBoardW = midplaneW/4, nodeBoardH = midplaneH/4;

  const ioDrawerGroupL = 2, ioDrawerGroupT = 15, ioDrawerGroupW = 30, ioDrawerGroupH = 30;
  const ioDrawerW = 10, ioDrawerH = 21.25;

  const legendL = L+W, legendT = T, legendW = 40, legendH = H;
  const legendMargin = {top: 20, bottom: 20, right: 30, left: 0};
  const legendWidth = legendW - legendMargin.left - legendMargin.right,
        legendHeight = legendH - legendMargin.top - legendMargin.bottom;

  var zoom = d3.zoom()
    .scaleExtent([1, 40])
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
    // var r = mira_rows.slice(i*16, i*16+16);
    var row = svg.append("g")
      .attr("class", "row")
      .attr("transform", "translate(0," + (rackH+rackPadding*2)*i + ")")
    for (j=0; j<16; j++) {
      var rack = row.append("g")
        .attr("class", "rack")
        .attr("id", rack2str(i, j))
        .attr("transform", "translate(" + ((rackW+rackPadding*2)*j + rackPadding) + "," + rackPadding + ")");
      rack.append("rect")
        .attr("class", "rackBox")
        .attr("width", rackW)
        .attr("height", rackH);
      rack.append("text")
        .attr("class", "rackID")
        .attr("x", rackW/2)
        .attr("y", midplaneTop-midplanePadding)
        .text(rack2str(i, j));

      for (k=0; k<2; k++) {
        var midplane = rack.append("g")
          .attr("class", "midplane")
          .attr("id", midplane2str(i, j, k))
          .attr("transform", "translate(" + midplanePadding + "," + (midplaneTop+(midplaneH+midplanePadding*2)*k) + ")");
        midplane.append("rect")
          .attr("class", "midplaneBox")
          .attr("width", midplaneW)
          .attr("height", midplaneH);

        for (p=0; p<4; p++) {
          for (q=0; q<4; q++) {
            var nodeBoardID = p*4+q;
            var nodeBoard = midplane.append("g")
              .attr("class", "nodeBoard")
              .attr("id", nodeBoard2str(i, j, k, nodeBoardID))
              .attr("transform", "translate(" + q*nodeBoardW + "," + p*nodeBoardH + ")");
            nodeBoard.append("rect")
              .attr("class", "nbbox")
              .attr("id", nodeBoard2str(i, j, k, nodeBoardID))
              .attr("title", nodeBoard2str(i, j, k, nodeBoardID))
              .attr("width", nodeBoardW)
              .attr("height", nodeBoardH);
          }
        }
      }
    }

    for (j=16; j<18; j++) {
      var ioRack = row.append("g")
        .attr("class", "ioRack")
        .attr("id", ioRack2str(i, j))
        .attr("transform", "translate(" + ((rackW+rackPadding*2)*j + rackPadding) + "," + rackPadding + ")");
      ioRack.append("rect")
        .attr("class", "rackBox")
        .attr("width", rackW)
        .attr("height", rackH);
      ioRack.append("text")
        .attr("class", "rackID")
        .attr("x", rackW/2)
        .attr("y", midplaneTop-midplanePadding)
        .text(ioRack2str(i, j));

      var ioDrawerGroup = ioRack.append("g")
        .attr("transform", "translate(" + ioDrawerGroupL + "," + ioDrawerGroupT + ")");

      for (p=0; p<3; p++) {
        for (q=0; q<3; q++) {
          var ioDrawerID = p*3+q;
          ioDrawerGroup.append("rect")
            .attr("class", "nbbox") // TODO
            .attr("id", ioDrawer2str(i, j, ioDrawerID))
            .attr("title", ioDrawer2str(i, j, ioDrawerID))
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
    .attr("id", "machineViewBrush")
    .call(brush);

  $(".nbbox").tooltip();

  var legendSvg = d3.select("#machineViewLegend").append("svg")
    .attr("class", "chart")
    .style("left", legendL)
    .style("top", legendT)
    .attr("width", legendW)
    .attr("height", legendH)
    .append("g")
    .attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top + ")");

  this.toggleLogScale = function() {
    // useLogScale = !useLogScale;
    // var colorScale = useLogScale ? colorScaleLog : colorScaleLinear; 
  }

  this.updateData = function(data) {
    var max = 10;
    for (var key in data) {
      max = d3.max([max, data[key]]);
    }

    max = Math.pow(10, Math.ceil(Math.log10(max)));

    // var max = 1000000; // TODO
    var domain = [1, max];
    var colorScale = d3.scaleLog()
      .domain(domain) 
      .nice(4)
      .clamp(true)
      .range(["white", "steelblue"])
      .interpolate(d3.interpolateCubehelixLong);
    var legendScale = d3.scaleLog()
      .domain(domain)
      .rangeRound([legendHeight, 0]);

    $(".nbbox").each(function() {
      var id = $(this).attr("id");
      var val = data[id];
      var color = val == undefined ? colorScale(0) : colorScale(val);
      $(this).css("fill", color);
    });

    /* // also works
    d3.selectAll(".nbbox").each(function(d){
      var _this = d3.select(this);
      var _id = _this.attr("id");
      var color; 
      if (data[_id] == undefined) color = scale(0);
      else color = scale(data[_id]);
      _this.style("fill", color);
    }); */

    legendSvg.selectAll("*").remove();
    var gradient = legendSvg.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%")
      .attr("spreadMethod", "pad");

    // var pct = linspace(0, Math.log10(
    var pct = logspace(1, max, 100);
    var pctMax = Math.log10(max);
    pct.forEach(function(d) {
      gradient.append("stop")
        .attr("offset", Math.log10(d) / pctMax)
        .attr("stop-color", colorScale(d))
        .attr("stop-opacity", 1);
    });

    legendSvg.append("rect")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#gradient)");

    var axis = d3.axisRight()
      .scale(legendScale)
      .ticks(3).tickSize(3)
      .tickFormat(function(d) {
        return d3.format(".2s")(d);
        // return "10" + formatPower(Math.round(Math.log10(d)));
      });

    legendSvg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + legendWidth + ",0)")
      .call(axis);

    legendSvg.selectAll(".domain").remove(); // remove the axis line

    function linspace(a, b, n) {
      var out = [];
      var delta = (b-a)/(n-1);
      var i=0;
      while (i<(n-1)) {
        out.push(a + i*delta);
        i++;
      }
      out.push(b);
      return out;
    }

    function logspace(a, b, n) {
      return linspace(Math.log10(a), Math.log10(b), n).map(function(x) {
        return Math.pow(10, x);
      });
    }
  }

  function brushed() {
    var s = d3.event.selection;
    if (s != null) {
      var locations = [];
      var b0 = $("#machineViewBrush > .selection")[0].getBoundingClientRect();
      $(".nbbox").filter(function() {
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
  $(".nbbox").css("fill", "white");
  $(".nbbox").filter(function() {
    var mpStr = $(this).attr("id").slice(0, 6);
    return set.has(mpStr);
  }).css("fill", "darkblue");
}

function highlightNodeBoard(str) {
  var nodeBoardStr = locationStrToNodeBoardStr(str);
  $(".nbbox#" + nodeBoardStr).css("fill", "red");
}

// createMachineView();
// highlightBlock("MIR-00000-73FF1-16384");
