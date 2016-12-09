const catalogServer = require("./build/Release/catalogServer.node");

var cs = new catalogServer.catalogServer();
cs.loadRASLog("raslog");

cs.query({
  t0: 1436184000000,
  t1: 1436936400000,
  category: [0],
  severity: [1, 2]
});
