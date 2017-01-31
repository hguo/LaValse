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