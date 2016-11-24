function createCharts(data) {
  var severityChart = dc.pieChart("#severityChart");
  var componentChart = dc.pieChart("#componentChart");
  var messageIdChart = dc.pieChart("#messageIdChart");
  var timelineChart = dc.lineChart("#timelineChart");

  var format = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ");
  data.forEach(function(e) {
    e.eventTime = format.parse(e.eventTime); 
  });

  var facts = crossfilter(data);
  var severityValue = facts.dimension(function(d) {return d.severity;});
  var severityGroup = severityValue.group();

  var componentValue = facts.dimension(function(d) {return d.component;});
  var componentGroup = componentValue.group();
  
  var messageIdValue = facts.dimension(function(d) {return d.messageID;});
  var messageIdGroup = messageIdValue.group();

  var volumeByHour = facts.dimension(function(d) {return d3.time.hour(d.eventTime);});
  var volumeByHourGroup = volumeByHour.group()
    .reduceCount(function(d) {return d.eventTime;});

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
    .mouseZoomable(true)
    .renderHorizontalGridLines(true)
    .x(d3.time.scale().domain(d3.extent(data, function(d) {return d.eventTime;})))
    .xAxis();

  dc.renderAll();
}
