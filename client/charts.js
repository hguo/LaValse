function createCharts(data) {
  var severityChart = dc.pieChart("#severityChart");
  var componentChart = dc.pieChart("#componentChart");
  var messageIdChart = dc.pieChart("#messageIdChart");
  var categoryChart = dc.pieChart("#categoryChart");
  var locationTypeChart = dc.pieChart("#locationTypeChart");
  var timelineChart = dc.lineChart("#timelineChart");
  var dataTable = dc.dataTable("#tableView");
  
  var messageIdTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      // return d.data.key + " (" + rasbook[d.data.key].description + "): " + d.data.value;
      return d.data.key + ": " + d.data.value;
    });

  var componentTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.data.key + " (" + rascomp[d.data.key] + "): " + d.data.value;
    });
  
  var categoryTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.data.key + " (" + rascat[d.data.key] + "): " + d.data.value;
    });
  
  var locationTypeTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
      return d.data.key + " (" + locationNarratives[d.data.key] + "): " + d.data.value;
    });

  var format = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ");
  data.forEach(function(e) {
    e.locationType = parseLocationType(e.location);
    e.eventTime = format.parse(e.eventTime); 
  });

  var facts = crossfilter(data);
  var severityValue = facts.dimension(function(d) {return rasbook[d.messageID].severity;});
  var severityGroup = severityValue.group();

  var componentValue = facts.dimension(function(d) {return rasbook[d.messageID].component;});
  var componentGroup = componentValue.group();
  
  var messageIdValue = facts.dimension(function(d) {return d.messageID;});
  var messageIdGroup = messageIdValue.group();

  var categoryValue = facts.dimension(function(d) {return rasbook[d.messageID].category;});
  var categoryGroup = categoryValue.group();

  var locationTypeValue = facts.dimension(function(d) {return d.locationType;});
  var locationTypeGroup = locationTypeValue.group();

  var nodeBoardValue = facts.dimension(function(d) {return locationStrToNodeBoardStr(d.location);});
  var nodeBoardGroup = nodeBoardValue.group();

  var volumeByHour = facts.dimension(function(d) {return d3.time.hour(d.eventTime);});
  var volumeByHourGroup = volumeByHour.group()
    .reduceCount(function(d) {return d.eventTime;});

  var volumeByLocation = facts.dimension(function(d) {return d.location;});

  var timeDimension = facts.dimension(function(d) {return d.eventTime;});

  severityChart.width(120)
    .height(120)
    .radius(50)
    .dimension(severityValue)
    .group(severityGroup)
    .transitionDuration(500);

  componentChart.width(120)
    .height(120)
    .radius(50)
    .dimension(componentValue)
    .group(componentGroup)
    .transitionDuration(500);

  messageIdChart.width(120)
    .height(120)
    .radius(50)
    .dimension(messageIdValue)
    .group(messageIdGroup)
    .transitionDuration(500);

  categoryChart.width(120)
    .height(120)
    .radius(50)
    // .externalLabels(10)
    // .externalRadiusPadding(10)
    // .drawPaths(true)
    .dimension(categoryValue)
    .group(categoryGroup)
    .transitionDuration(500);

  locationTypeChart.width(120)
    .height(120)
    .radius(50)
    .dimension(locationTypeValue)
    .group(locationTypeGroup)
    .transitionDuration(500);
 
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
        function(d) {return d.serialNumber;},
        function(d) {return d.CPU;},
        function(d) {return d.message;}
    ])
    .sortBy(function(d) {return d.eventTime;})
    .order(d3.ascending);

  dc.renderAll();
  
  d3.selectAll("#messageIdChart .pie-slice")
    .call(messageIdTip)
    .on("mouseover", messageIdTip.show)
    .on("mouseout", messageIdTip.hide);

  d3.selectAll("#componentChart .pie-slice")
    .call(componentTip)
    .on("mouseover", componentTip.show)
    .on("mouseout", componentTip.hide);
  
  d3.selectAll("#categoryChart .pie-slice")
    .call(categoryTip)
    .on("mouseover", categoryTip.show)
    .on("mouseout", categoryTip.hide);
  
  d3.selectAll("#locationTypeChart .pie-slice")
    .call(locationTypeTip)
    .on("mouseover", locationTypeTip.show)
    .on("mouseout", locationTypeTip.hide);
}
