function horizonGlyphChart() {
  var data = [16518,20455,20719,15836,20120,20686,118646,30930,37535,38301,96821,36438,159755,22626,21568,19511,15827,18269,22523,25342,24702,25420,20445,20331,17925,14655,13488,16433,19595,18281,19370,44243,54246,22529,17453,17957,17902,17613,20392,13769,16948,18052,19025,25688,59331,42054,16158,22120,60861,24824,21563,29922,30375,15240,35350,29819,26565,25748,20481,20624,17917,34589,20663,19532,21176,16625,22535,11016,24184,28699,29180,26198,24906,23430,31988,22124,29213,25794,25930,27195,28427,15204,15722,29235,24883,37126,25339,19854,20910,19993,41499,19016,372288,39673,22446,16685,48421,20256,35602,20707,18414,37838,19393,36521,23601,27727,18437,368156,30446,38671,97470,24456,18842,21010,18792,21390,25823,17812,23259,20198,17526,24355,19105,17679,13987,18985,15502,12206,12308,33499,16114,18201,22535,21904,18971,70887,15498,17349,53700,20439,34508,39746,14243,11936,11990,26461,26575,30595,14070,80899,16145,3454,20792,19605];
  const margin = {top: 20, right: 10, bottom: 20, left: 50};
  const W = 800, H = 300;
  const width = W - margin.left - margin.right
        height = H - margin.top - margin.bottom;
  const nSlotsY = 40;
  const glyphWidth = width/data.length, glyphHeight = height/nSlotsY;

  var svg = d3.select("body")
    .append("svg")
    .attr("width", W)
    .attr("height", H)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

  var max = d3.max(data, function(d) {return d;});

  var x = d3.scaleLinear()
    .range([0, width])
    .domain([0, data.length]);
  var y = d3.scaleLinear()
    .range([height, 0])
    .domain([0, d3.max(data, function(d) {return d;})]);
  var y1 = d3.scaleLinear()
    .rangeRound([height, 0])
    .domain([0, nSlotsY]);

  var line = d3.line()
    .x(function(d, i) {return x(i);})
    .y(function(d) {return y1(Math.ceil(d/max*nSlotsY));})
    .curve(d3.curveStep);
    // .y(function(d) {return y(d);});

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  /*
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("d", line);*/

  var group = svg.selectAll(".glyphGroup")
    .data(data).enter()
    .append("g")
    .attr("class", "glyphGroup")
    .attr("transform", function(d, i) {
      return "translate(" + x(i) + "," + height + ") scale(1, -1)";
    });

  group.each(function(dd, i) {
    var array = [];
    var n = Math.ceil(dd/max*nSlotsY);
    for (var k=0; k<n; k++) 
      array.push(k); // TODO

    d3.select(this)
      .selectAll("rect")
      .data(array).enter()
      .append("rect")
      .attr("y", function(d, j) {
        return j*glyphHeight;
      })
      .attr("width", glyphWidth)
      .attr("height", glyphHeight)
      .style("stroke-width", 0.5)
      .style("fill", "none")
      .style("stroke", "black");
  });
}

horizonGlyphChart();
