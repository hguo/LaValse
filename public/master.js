var query = {
  T0: 1420070400000, // 2015-01-01
  T1: 1451520000000, // 2015-12-31
  tg: 86400000 // aggregation by day
};
var severityChart, componentChart, categoryChart, locationTypeChart, timeVolumeChart;
var machineView;

init();

function init() {
  d3.json("/cube?query={}", function (d) {
    if (d == null || d == undefined) return;
    severityChart = new barChart(
        "severity", "#severityChart", histogramToArray(d.severity), 
        {L: 0, T: 0, W: 200, H: 100});
    componentChart = new barChart(
        "component", "#componentChart", histogramToArray(d.component),
        {L: 0, T: 100, W: 200, H: 200});
    categoryChart = new barChart(
        "category", "#categoryChart", histogramToArray(d.category),
        {L: 200, T: 0, W: 200, H: 300});
    locationTypeChart = new barChart(
        "locationType", "#locationTypeChart", histogramToArray(d.locationType),
        {L: 400, T: 0, W: 200, H: 300});
    timeVolumeChart = new timeVolumeChart(
        "#timeVolumeChart", histogramToArray(d.timeVolume), 
        {L: 0, T: 300, W: 1200, H: 100});
    machineView = new machineView();
    machineView.updateData(d.RMN, histogramToArray(d.RMN));
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
    timeVolumeChart.updateData(histogramToArray(d.timeVolume), 
        {L: 0, T: 400, W: 600, H: 150});
    machineView.updateData(d.RMN, histogramToArray(d.RMN));
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
