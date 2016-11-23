function createMachineView() {
  const W = 1000, H = 400;
  const margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  const rackW = 54, rackH = 121, rackPadding = 3;
  const midplaneW = 50, midplaneH = 50, midplaneTop = 15, midplanePadding = 2;
  const nodeBoardW = midplaneW/4, nodeBoardH = midplaneH/4;

  var tip = d3.select("#machineView").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden");
  tip.append("p").html("hello world");

  var svg = d3.select("#machineView").append("svg")
    .attr("id", "machineView")
    .attr("width", W)
    .attr("height", H)
    .append("g")
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
              .attr("class", "nodeBoardBox")
              .attr("id", nodeBoard2str(i, j, k, nodeBoardID))
              .attr("width", nodeBoardW)
              .attr("height", nodeBoardH);
          }
        }
      }
    }
  }

  $(".nodeBoardBox").hover(function(evt) {
    tip.style("visibility", "visible");
    tip.select("p").html($(this).attr("id"));
  });
  $(".nodeBoardBox").mouseleave(function() {
    tip.style("visibility", "hidden");
  });
}

function highlightBlock(str) {
  // console.log(str);
  var set = parseComputeBlock(str);
  $(".nodeBoardBox").css("fill", "white");
  $(".nodeBoardBox").filter(function() {
    var mpStr = $(this).attr("id").slice(0, 6);
    return set.has(mpStr);
  }).css("fill", "darkblue");
}

function highlightNodeBoard(str) {
  var loc = parseLocation(str);
  console.log(loc);
  $(".nodeBoardBox").filter(function() {
    var mpStr = $(this).attr("id").slice(0, 6);
    var mp = parseMidplane(mpStr);
    var nb = parseInt($(this).attr("id").slice(8, 10));
    return mp.row == loc.row && mp.column == loc.column && mp.midplane == loc.midplane && nb == loc.nodeBoard;
  }).css("fill", "red");
}

createMachineView();
// highlightBlock("MIR-00000-73FF1-16384");
