var query = {};
var severityChart, componentChart, categoryChart, locationTypeChart;

init();

function init() {
  d3.json("/cube?query={}", function (d) {
    severityChart = new barChart(
        "severity", "#severityChart", histogramToArray(d.severity), 
        {L: 0, T: 0, W: 200, H: 100});
    componentChart = new barChart(
        "component", "#componentChart", histogramToArray(d.component),
        {L: 0, T: 100, W: 200, H: 300});
    categoryChart = new barChart(
        "category", "#categoryChart", histogramToArray(d.category),
        {L: 200, T: 0, W: 200, H: 400});
    locationTypeChart = new barChart(
        "locationType", "#locationTypeChart", histogramToArray(d.locationType),
        {L: 400, T: 0, W: 200, H: 400});
    timeVolumeChart("#timeVolumeChart", histogramToArray(d.timeVolume), 
        {L: 0, T: 400, W: 600, H: 150});
  });
}

function refresh() {
  d3.json("/cube?query=" + JSON.stringify(query), function (d) {
    console.log(query);
    console.log(d);
    severityChart.updateData(histogramToArray(d.severity));
    componentChart.updateData(histogramToArray(d.component));
    categoryChart.updateData(histogramToArray(d.category));
    locationTypeChart.updateData(histogramToArray(d.locationType));
    timeVolumeChart("#timeVolumeChart", histogramToArray(d.timeVolume), 
        {L: 0, T: 400, W: 600, H: 150});
  });
}

function histogramToArray(r) {
  var array = []; 
  for (var key in r) {
    array.push({
      k: key, 
      v: r[key]
    });
  }
  return array;
}
