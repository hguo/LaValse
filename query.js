const catalogCube = require("./cpp/build/Release/catalogCube.node");
const ras = require("./ras");

var cube = new catalogCube.catalogCube();

cube.loadRASLog("raslog");
var results = cube.query({
  t0: 1436184000000,
  t1: 1436936400000,
  category: [0],
  severity: [1, 2]
});

console.log(results);


function translateQuery(q0) {
  if ("component" in q0) {
    q.component = [];
    q0.component.forEach(function(e) {
      var index = 
      q.component.push()
    });
  }
}
