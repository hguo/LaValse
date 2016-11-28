var ws;

function connectToServer() {
  var host = window.location.host;
  var uri = "ws://" + host + "/ws";
  console.log(uri);
  
  // ws = new WebSocket("ws://localhost:8081/ws");
  ws = new WebSocket(uri);
  ws.onopen = function(evt) {
    console.log("connected to server.");
    requestRASLog({}, new Date("2015-01-04"), new Date("2015-01-06"));
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
  console.log(msg);
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
