function machineView() {
  const L = 600, T = 20, W = 612, H = 258;
  const margin = {top: 2, right: 2, bottom: 2, left: 2},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  const rackW = 34, rackH = 81, rackPadding = 2;
  const midplaneW = 30, midplaneH = 30, midplaneTop = 15, midplanePadding = 2;
  const nodeBoardW = midplaneW/4, nodeBoardH = midplaneH/4;

  var tip = d3.select("#machineView").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden");
  tip.append("p").html("hello world");

  var svg = d3.select("#machineView").append("svg")
    .attr("class", "chart")
    .style("left", L)
    .style("top", T)
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("id", "machineViewSvg")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
              .attr("width", nodeBoardW)
              .attr("height", nodeBoardH);
          }
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

  /*
  $(".nbbox").hover(function(evt) {
    tip.style("visibility", "visible");
    tip.select("p").html($(this).attr("id"));
  });
  $(".nbbox").mouseleave(function() {
    tip.style("visibility", "hidden");
  });
  */

  this.updateData = function(data) {
    var scale = d3.scaleLog()
      .domain([1, 100000]) // TODO
      .clamp(true)
      .range(["white", "steelblue"])
      .interpolate(d3.interpolateCubehelixLong);

    $(".nbbox").each(function() {
      var id = $(this).attr("id");
      var val = data[id];
      var color = val == undefined ? scale(0) : scale(val);
      $(this).css("fill", color);
    })

    /* // also works
    d3.selectAll(".nbbox").each(function(d){
      var _this = d3.select(this);
      var _id = _this.attr("id");
      var color; 
      if (data[_id] == undefined) color = scale(0);
      else color = scale(data[_id]);
      _this.style("fill", color);
    }); */
  }

  function brushed() {
    var s = d3.event.selection;
    if (s != null) {
      var RMN = [];
      var b0 = $("#machineViewBrush > .selection")[0].getBoundingClientRect();
      $(".nbbox").filter(function() {
        var b = $(this)[0].getBoundingClientRect();
        var x = b.left, y = b.top;
        return x>=b0.left && x<=b0.right && y>=b0.top && y<=b0.bottom;
      }).each(function() {
        RMN.push($(this).attr("id"));
      });
      if (RMN.length > 0) {
        query["RMN"] = RMN;
        refresh();
      }
    } else {
      delete query["RMN"];
      refresh();
    }
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
