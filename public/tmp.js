  function brushed() {
    var s = d3.event.selection;
    if (s != null) {
      var locations = [];
      $(".c").filter(function() {
        return AABB.inside($("#machineViewBrush > .selection")[0], $("#machineViewSvg")[0]); 
      }).each(function() {
        locations.push($(this).attr("id"));
      });
      if (locations.length > 0) {
        query["location"] = locations;
        refresh();
      }
    } else {
      delete query["location"];
      refresh();
    }
  }

/*
var torusRMNJMap = new function() {
  var torusMap = {};
  var RMNJMap = {};

  d3.csv("/torusRMNJ.csv", function(err, data) {
    data.forEach(function(d) {
      torusMap[d.torus] = d.RMNJ;
      RMNJMap[d.RMNJ] = d.torus;
    });
  });

  this.torus = function(RMNJ) {
    return RMNJMap[RMNJ];
  }
  
  this.RMNJ = function(torus) {
    return torusMap[torus];
  }

  this.neighbors = function(coords) {
    function R(a, l, inc) { // a is the char that encodes the coordinate, l is the limit
      var A = (parseInt(a, 16) + inc + l) % l;
      return A.toString(16).toUpperCase();
    }
    function S(coords, i, inc) {
      const limits = [8, 12, 16, 16, 2];
      var digit = R(coords[i], limits[i], inc);
      var str = "";
      for (var j=0; j<5; j++) 
        if (i == j) str += digit; 
        else str += coords[j];
      return str;
    }
    return {
      Ar: S(coords, 0, -1),
      At: S(coords, 0, 1),
      Br: S(coords, 1, -1),
      Bt: S(coords, 1, 1),
      Cr: S(coords, 2, -1),
      Ct: S(coords, 2, 1),
      Dr: S(coords, 3, -1),
      Dt: S(coords, 3, 1),
      Er: S(coords, 4, -1),
      Et: S(coords, 4, 1),
    };
  }
} */
