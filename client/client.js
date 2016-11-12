var ws;

function connectToServer() {
  ws = new WebSocket("ws://localhost:8082");
  ws.onopen = function(evt) {
    console.log("connected to server.");
    requestRASLog("FATAL", new Date(2015, 8, 20), new Date(2015, 10, 25));
  };

  ws.onmessage = function(evt) {
    var msg = JSON.parse(evt.data);
    if (msg.type == "RASLog") {
      updateRASLog(msg.RASLog);
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

function updateRASLog(data) {
  updateTimelineView(data);
}

connectToServer();
