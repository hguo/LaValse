function createCharts(data) {
  var severityChart = dc.rowChart("#severityChart");
  var componentChart = dc.rowChart("#componentChart");
  var messageIdChart = dc.rowChart("#messageIdChart");
  var categoryChart = dc.rowChart("#categoryChart");
  var locationTypeChart = dc.rowChart("#locationTypeChart");
  // var dayOfWeekChart = dc.rowChart("#dayOfWeekChart");
  var timelineChart = dc.lineChart("#timelineChart");
  var dataTable = dc.dataTable("#tableView");

  const transitionDuration = 200;
  
  var severityTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.key + ": " + d.value;
    });
  
  var messageIdTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      // return d.data.key + " (" + rasbook[d.data.key].description + "): " + d.data.value;
      return d.key + ": " + d.value;
    });

  var componentTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.key + " (" + rascomp[d.key] + "): " + d.value;
    });
  
  var categoryTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.key + " (" + rascat[d.key] + "): " + d.value;
    });
  
  var locationTypeTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.key + " (" + locationNarratives[d.key] + "): " + d.value;
    });

  // var format = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ");
  data.forEach(function(e) {
    e.lt = parseLocationType(e.l);
    // e.eventTime = format.parse(e.eventTime); 
  });

  var ndx = crossfilter(data);
  var severityValue = ndx.dimension(function(d) {
    var val = rasbook[d.i].severity;
    return val == undefined ? "" : val;
  });
  var severityGroup = severityValue.group();

  var componentValue = ndx.dimension(function(d) {
    var val = rasbook[d.i].component;
    return val == undefined ? "" : val;
  });
  var componentGroup = componentValue.group();
  
  var messageIdValue = ndx.dimension(function(d) {
    var val = d.i;
    return val == undefined ? "" : val;
  });
  var messageIdGroup = messageIdValue.group();

  var categoryValue = ndx.dimension(function(d) {
    var val = rasbook[d.i].category;
    return val == undefined ? "" : val;
  });
  var categoryGroup = categoryValue.group();

  var locationTypeValue = ndx.dimension(function(d) {
    var val = d.lt;
    return val == undefined ? "" : val;
  });
  var locationTypeGroup = locationTypeValue.group();

  /* 
  var nodeBoardValue = ndx.dimension(function(d) {
    var val = locationStrToNodeBoardStr(d.l);
    return val == undefined ? "" : val;
  });
  var nodeBoardGroup = nodeBoardValue.group();
  */

  /*
  var dayOfWeek = ndx.dimension(function(d) {
    var day = d.eventTime.getDay();
    var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return day + '.' + name[day];
  });
  */

  var volumeByHour = ndx.dimension(function(d) {return d3.time.hour(d.t);});
  var volumeByHourGroup = volumeByHour.group()
    .reduceCount(function(d) {return d.t;});

  var volumeByLocation = ndx.dimension(function(d) {return d.l;});

  var timeDimension = ndx.dimension(function(d) {return d.t;});

  severityChart.width(300)
    .height(300)
    .dimension(severityValue)
    .group(severityGroup)
    .transitionDuration(transitionDuration)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  componentChart.width(300)
    .height(300)
    .dimension(componentValue)
    .group(componentGroup)
    .transitionDuration(transitionDuration)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  messageIdChart.width(300)
    .height(300)
    .dimension(messageIdValue)
    .group(messageIdGroup)
    .transitionDuration(transitionDuration)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  categoryChart.width(300)
    .height(300)
    .dimension(categoryValue)
    .group(categoryGroup)
    .transitionDuration(transitionDuration)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  locationTypeChart.width(300)
    .height(300)
    .dimension(locationTypeValue)
    .group(locationTypeGroup)
    .transitionDuration(transitionDuration)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);
 
  /*
  dayOfWeekChart.width(300)
    .height(300)
    .dimension(dayOfWeek)
    .group(dayOfWeek)
    .transitionDuration(transitionDuration)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);
  */
 
  /*
  timelineChart.width(960)
    .height(100)
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .dimension(volumeByHour)
    .group(volumeByHourGroup)
    .transitionDuration(transitionDuration)
    .elasticY(true)
    .x(d3.time.scale().domain(d3.extent(data, function(d) {return d.eventTime;})))
    .xAxis();
  */
  timelineChart
    .renderArea(true)
    .width(960)
    .height(100)
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .dimension(volumeByHour)
    .group(volumeByHourGroup)
    .transitionDuration(transitionDuration)
    .elasticY(true)
    // .mouseZoomable(true)
    .renderHorizontalGridLines(true)
    .x(d3.time.scale().domain(d3.extent(data, function(d) {return d.t;})))
    .xAxis();

  dataTable.width(960).height(800)
    .dimension(timeDimension)
    .group(function(d) {return "";})
    .showGroups(false)
    .size(10)
    .columns([
        function(d) {return d.id;},
        function(d) {return d.i;},
        function(d) {return rasbook[d.i].severity;},
        function(d) {return d.t.toISOString();},
        function(d) {return d.j;},
        function(d) {return d.b;},
        function(d) {
          return "<a href='javascript:highlightBlockAndLocation(\"" + d.block + "\",\"" + d.l
            + "\")'>" + d.l + "</a>"},
        // function(d) {return d.serialNumber;},
        function(d) {return d.c;},
        function(d) {return d.m;}
    ])
    .sortBy(function(d) {return d.t;})
    .order(d3.ascending);

  dc.renderAll();
  
  d3.selectAll("#severityChart .row")
    .call(severityTip)
    .on("mouseover", severityTip.show)
    .on("mouseout", severityTip.hide);
  
  d3.selectAll("#messageIdChart .row")
    .call(messageIdTip)
    .on("mouseover", messageIdTip.show)
    .on("mouseout", messageIdTip.hide);

  d3.selectAll("#componentChart .row")
    .call(componentTip)
    .on("mouseover", componentTip.show)
    .on("mouseout", componentTip.hide);
  
  d3.selectAll("#categoryChart .row")
    .call(categoryTip)
    .on("mouseover", categoryTip.show)
    .on("mouseout", categoryTip.hide);
  
  d3.selectAll("#locationTypeChart .row")
    .call(locationTypeTip)
    .on("mouseover", locationTypeTip.show)
    .on("mouseout", locationTypeTip.hide);
}
