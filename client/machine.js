//var mira_rows = [];
//var mira_planes = ["M0", "M1"];

function pad(number, radix, length) {
  var str = number.toString(radix).toUpperCase();
  while (str.length < length) str = '0' + str;
  return str;
}

function rackID2str(rack) {
  return "R" + pad(rack, 16, 2);
}

function planeID2str(rack, plane) { // plane is either 0 or 1
  return rackID2str(rack) + "-M" + plane
}

function nodeID2str(rack, plane, node) {
  return planeID2str(rack, plane) + "-N" + pad(node, 10, 2);
}

function createMachineView() {
  const W = 1000, H = 400;
  const margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  const rackW = 54, rackH = 121, rackPadding = 3;
  const cabinW = 50, cabinH = 50, cabinTop = 15, cabinPadding = 2;
  const nodeW = cabinW/4, nodeH = cabinH/4;

  var svg = d3.select("body").append("svg")
    .attr("id", "machineView")
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var tip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden");
  tip.append("p").html("hello world");

  for (i=0; i<3; i++) {
    // var r = mira_rows.slice(i*16, i*16+16);
    var row = svg.append("g")
      .attr("class", "row")
      .attr("transform", "translate(0," + (rackH+rackPadding*2)*i + ")")
    for (j=0; j<16; j++) {
      var rackID = i * 16 + j;
      var rack = row.append("g")
        .attr("class", "rack")
        .attr("id", rackID2str(rackID))
        .attr("transform", "translate(" + ((rackW+rackPadding*2)*j + rackPadding) + "," + rackPadding + ")");
      rack.append("rect")
        .attr("class", "rackBox")
        .attr("width", rackW)
        .attr("height", rackH);
      rack.append("text")
        .attr("class", "rackID")
        .attr("x", rackW/2)
        .attr("y", cabinTop-cabinPadding)
        .text(rackID2str(rackID));

      for (k=0; k<2; k++) {
        var cabin = rack.append("g")
          .attr("class", "cabin")
          .attr("id", planeID2str(rackID, k))
          .attr("transform", "translate(" + cabinPadding + "," + (cabinTop+(cabinH+cabinPadding*2)*k) + ")");
        cabin.append("rect")
          .attr("class", "cabinBox")
          .attr("width", cabinW)
          .attr("height", cabinH);

        for (p=0; p<4; p++) {
          for (q=0; q<4; q++) {
            var nodeID = p*4+q;
            var node = cabin.append("g")
              .attr("class", "node")
              .attr("id", nodeID2str(rackID, k, nodeID))
              .attr("transform", "translate(" + q*nodeW + "," + p*nodeH + ")");
            node.append("rect")
              .attr("class", "nodeBox")
              .attr("id", nodeID2str(rackID, k, nodeID))
              .attr("width", nodeW)
              .attr("height", nodeH);
          }
        }
      }
    }
  }

  $(".nodeBox").hover(function(evt) {
    tip.style("visibility", "visible");
    tip.select("p").html($(this).attr("id"));
  });
  $(".nodeBox").mouseleave(function() {
    tip.style("visibility", "hidden");
  })
}

createMachineView();