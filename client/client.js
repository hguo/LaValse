var ws;

function connectToServer() {
  ws = new WebSocket("ws://localhost:8082");
  ws.onopen = function(evt) {
    console.log("connected to server.");
    requestRASLog({}, new Date("1/5/2015"), new Date("1/10/2015"));
  };

  ws.onmessage = function(evt) {
    var msg = JSON.parse(evt.data);
    if (msg.type == "RASLog") {
      updateRASLog(msg.RASLog);
    } if (msg.type == "RASHistogram") {
      updateRASHistogram(msg.RASHistogram);
      // console.log(msg);
    }
  };
}

function requestRASLog(query, date0, date1) {
  var msg = {
    type: "requestRASLog",
    date0: date0, 
    date1: date1,
    query: query
  };
  ws.send(JSON.stringify(msg));
}

function requestHistogram(query) {
  var msg = {
    type: "requestHistogram", 
    query: query
  };
  ws.send(JSON.stringify(msg));
}

function requestRASHistogram(severity, granularity, date0, date1) {
  var msg = {
    type: "requestRASHistogram",
    severity: severity, 
    granularity: granularity,
    date0: date0, 
    date1: date1
  };
  ws.send(JSON.stringify(msg));
}

function updateRASLog(data) {
  createCharts(data);
  // updateTimelineView(data);
}

function updateRASHistogram(data) {
  updateHistogramView(data);
}

connectToServer();
