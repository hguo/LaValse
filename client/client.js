var ws;

function connectToServer() {
  ws = new WebSocket("ws://localhost:8082");
  ws.onopen = function(evt) {
    console.log("connected to server.");
    // requestRASLog("FATAL", new Date("1/1/2015"), new Date("1/10/2015"));
    requestRASHistogram("INFO", "day", new Date("2015-01-01"), new Date("2015-01-10"));
  };

  ws.onmessage = function(evt) {
    var msg = JSON.parse(evt.data);
    if (msg.type == "RASLog") {
      updateRASLog(msg.RASLog);
    } if (msg.type == "RASHistogram") {
      console.log(msg);
    }
  };
}

function requestRASLog(severity, date0, date1) {
  var msg = {
    type: "requestRASLog",
    severity: severity,
    date0: date0, 
    date1: date1
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
  updateTimelineView(data);
}

connectToServer();
