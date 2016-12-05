var ws;

function connectToServer() {
  var host = window.location.host;
  var uri = "ws://" + host + "/ws";
  console.log(uri);
  
  ws = new WebSocket(uri);
  ws.binaryType = "arraybuffer";
  ws.onopen = function(evt) {
    console.log("connected to server.");
    requestRASLog({}, new Date("2015-01-01"), new Date("2015-01-10"));
  };

  ws.onmessage = function(evt) {
    // var msg = JSON.parse(evt.data);
    var msg = msgpack.decode(new Uint8Array(evt.data));
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
  // ws.send(JSON.stringify(msg));
  ws.send(msgpack.encode(msg));
}

function requestHistogram(query) {
  var msg = {
    type: "requestHistogram", 
    query: query
  };
  // ws.send(JSON.stringify(msg));
  ws.send(msgpack.encode(msg));
}

function requestRASHistogram(severity, granularity, date0, date1) {
  var msg = {
    type: "requestRASHistogram",
    severity: severity, 
    granularity: granularity,
    date0: date0, 
    date1: date1
  };
  // ws.send(JSON.stringify(msg));
  ws.send(msgpack.encode(msg));
}

function updateRASLog(data) {
  createCharts(data);
  // updateTimelineView(data);
}

function updateRASHistogram(data) {
  updateHistogramView(data);
}

connectToServer();
