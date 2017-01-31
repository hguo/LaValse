var canvas = d3.select("body").append("canvas")
  .attr("width", 800)
  .attr("height", 600);
var ctx = canvas.node().getContext("2d");

adjustCanvasResolution(canvas.node(), ctx);

function adjustCanvasResolution(canvas, ctx) {
  var devicePixelRatio = window.devicePixelRatio || 1, 
      backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                          ctx.mozBackingStorePixelRatio ||
                          ctx.msBackingStorePixelRatio ||
                          ctx.oBackingStorePixelRatio ||
                          ctx.backingStorePixelRatio || 1;

  var ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    ctx.scale(ratio, ratio);
  }
}

var data = [1, 2, 13, 20, 23];

var scale = d3.scaleLinear()
  .range([10, 390])
  .domain([1, 23]);

data.forEach(function(d, i) {
  ctx.beginPath();
  ctx.rect(scale(d), 150, 10, 10);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
});
