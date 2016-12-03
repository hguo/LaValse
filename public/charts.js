function createCharts(data) {
  var severityChart = dc.rowChart("#severityChart");
  var componentChart = dc.rowChart("#componentChart");
  var messageIdChart = dc.rowChart("#messageIdChart");
  var categoryChart = dc.rowChart("#categoryChart");
  var locationTypeChart = dc.rowChart("#locationTypeChart");
  // var dayOfWeekChart = dc.rowChart("#dayOfWeekChart");
  var timelineChart = dc.lineChart("#timelineChart");
  var dataTable = dc.dataTable("#tableView");
  
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
    e.locationType = parseLocationType(e.location);
    // e.eventTime = format.parse(e.eventTime); 
  });

  var ndx = crossfilter(data);
  var severityValue = ndx.dimension(function(d) {
    var val = rasbook[d.messageID].severity;
    return val == undefined ? "" : val;
  });
  var severityGroup = severityValue.group();

  var componentValue = ndx.dimension(function(d) {
    var val = rasbook[d.messageID].component;
    return val == undefined ? "" : val;
  });
  var componentGroup = componentValue.group();
  
  var messageIdValue = ndx.dimension(function(d) {
    var val = d.messageID;
    return val == undefined ? "" : val;
  });
  var messageIdGroup = messageIdValue.group();

  var categoryValue = ndx.dimension(function(d) {
    var val = rasbook[d.messageID].category;
    return val == undefined ? "" : val;
  });
  var categoryGroup = categoryValue.group();

  var locationTypeValue = ndx.dimension(function(d) {
    var val = d.locationType;
    return val == undefined ? "" : val;
  });
  var locationTypeGroup = locationTypeValue.group();

  var nodeBoardValue = ndx.dimension(function(d) {
    var val = locationStrToNodeBoardStr(d.location);
    return val == undefined ? "" : val;
  });
  var nodeBoardGroup = nodeBoardValue.group();

  /*
  var dayOfWeek = ndx.dimension(function(d) {
    var day = d.eventTime.getDay();
    var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return day + '.' + name[day];
  });
  */

  var volumeByHour = ndx.dimension(function(d) {return d3.time.hour(d.eventTime);});
  var volumeByHourGroup = volumeByHour.group()
    .reduceCount(function(d) {return d.eventTime;});

  var volumeByLocation = ndx.dimension(function(d) {return d.location;});

  var timeDimension = ndx.dimension(function(d) {return d.eventTime;});

  severityChart.width(300)
    .height(300)
    .dimension(severityValue)
    .group(severityGroup)
    .transitionDuration(500)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  componentChart.width(300)
    .height(300)
    .dimension(componentValue)
    .group(componentGroup)
    .transitionDuration(500)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  messageIdChart.width(300)
    .height(300)
    .dimension(messageIdValue)
    .group(messageIdGroup)
    .transitionDuration(500)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  categoryChart.width(300)
    .height(300)
    .dimension(categoryValue)
    .group(categoryGroup)
    .transitionDuration(500)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);

  locationTypeChart.width(300)
    .height(300)
    .dimension(locationTypeValue)
    .group(locationTypeGroup)
    .transitionDuration(500)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);
 
  /*
  dayOfWeekChart.width(300)
    .height(300)
    .dimension(dayOfWeek)
    .group(dayOfWeek)
    .transitionDuration(500)
    .x(d3.scale.linear().domain([6,20]))
    .elasticX(true);
  */
 
  /*
  timelineChart.width(960)
    .height(100)
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .dimension(volumeByHour)
    .group(volumeByHourGroup)
    .transitionDuration(500)
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
    .transitionDuration(500)
    .elasticY(true)
    // .mouseZoomable(true)
    .renderHorizontalGridLines(true)
    .x(d3.time.scale().domain(d3.extent(data, function(d) {return d.eventTime;})))
    .xAxis();

  dataTable.width(960).height(800)
    .dimension(timeDimension)
    .group(function(d) {return "";})
    .showGroups(false)
    .size(10)
    .columns([
        function(d) {return d._id;},
        function(d) {return d.messageID;},
        function(d) {return d.severity;},
        function(d) {return d.eventTime;},
        function(d) {return d.jobID;},
        function(d) {return d.block;},
        function(d) {
          return "<a href='javascript:highlightBlockAndLocation(\"" + d.block + "\",\"" + d.location 
            + "\")'>" + d.location + "</a>"},
        // function(d) {return d.serialNumber;},
        function(d) {return d.CPU;},
        function(d) {return d.message;}
    ])
    .sortBy(function(d) {return d.eventTime;})
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
