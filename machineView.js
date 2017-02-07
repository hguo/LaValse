var mira = require("./mira");

function machineView() {
  const L = 270, T = 25, W = 690, H = 306;
  const margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = W - margin.left - margin.right,
        height = H - margin.top - margin.bottom;
  
  const rackW = 34, rackH = 96, rackPadding = 2;
 
  const midplaneGroupL = 2, midplaneGroupT = 10;
  const midplaneW = 30, midplaneH = 41, midplanePadding = 2;
 
  const nodeBoardGroupL = 0, nodeBoardGroupT = 5, nodeBoardGroupW = 30, nodeBoardGroupH = 30;
  const nodeBoardW = 7.5, nodeBoardH = 9;

  const computeCardGroupL = 0, computeCardGroupT = 1.5;
  const computeCardW = 0.9375, computeCardH = 0.9375;
  // const computeCardW = 0.9375, computeCardH = 1.875;

  const linkModuleGroupL = 0, linkModuleGroupT = 5.25;
  const linkModuleW = 1.25, linkModuleH = 1.25;

  const opticalModuleGroupL = 3.75, opticalModuleGroupT = 5.25;
  const opticalModuleW = 0.625, opticalModuleH = 0.625;

  const DCAGroupL = 3.75, DCAGroupT = 0.25;
  const DCAW = 1.75, DCAH = 1;

  const ioDrawerGroupL = 2, ioDrawerGroupT = 12, ioDrawerGroupW = 30, ioDrawerGroupH = 82;
  const ioDrawerW = ioDrawerGroupW/3, ioDrawerH = ioDrawerGroupH/3;

  const bulkPowerSupplyGroupL = 19.75, bulkPowerSupplyGroupT = 2;
  const bulkPowerSupplyW = 3, bulkPowerSupplyH = 3;

  const powerModuleGroupL = 0, powerModuleGroupT = 0;
  const powerModuleW = 1, powerModuleH = 1;

  const clockCardL = 25.75, clockCardT = 2;
  const clockCardW = 3, clockCardH = 6;

  const coolantMonitorL = 28.75, coolantMonitorT = 2;
  const coolantMonitorW = 3, coolantMonitorH = 6;

  const serviceCardL = 21, serviceCardT = 1;
  const serviceCardW = 8, serviceCardH = 3;

  const legendL = L+W, legendT = T, legendW = 40, legendH = H;
  const legendMargin = {top: 20, bottom: 20, right: 30, left: 0};
  const legendWidth = legendW - legendMargin.left - legendMargin.right,
        legendHeight = legendH - legendMargin.top - legendMargin.bottom;

  var transformer = new function() {
    var stack = [];
    var currentTransform = [0, 0];
  
    function vecAdd(a, b) {
      var c = [];
      for (var i=0; i<a.length; i++) c.push(a[i] + b[i]);
      return c;
    }
    
    function vecSub(a, b) {
      var c = [];
      for (var i=0; i<a.length; i++) c.push(a[i] - b[i]);
      return c;
    }

    this.push = function(transform) {
      stack.push(transform);
      currentTransform = vecAdd(currentTransform, transform);
    }
    
    this.pop = function() {
      var transform = stack.pop();
      currentTransform = vecSub(currentTransform, transform);
    }

    this.transform = function(x) {
      return vecAdd(currentTransform, x);
    }

    this.zero = function() {
      return currentTransform;
    }
  }

  console.log('id,lod,x,y,w,h,lw,tx,ty,ts,text');
  function printElement(str, level, zero, w, h, lw, tx, ty, ts, text) {
    console.log(str + "," + level + ","
        + zero[0] + "," + zero[1] + "," + w + "," + h + "," + lw + "," 
        + (zero[0]+tx) + "," + (zero[1]+ty) + "," + ts + "," + text);
  }

  renderRacks();

  // renderMachinesL4();
  // renderMachinesL3();
  // renderMachinesL2();

  /*
  function renderMachinesL4() {
    renderRacks(svg);
  }

  function renderMachinesL3() {
    $("#machineView .R").each(function() {
      renderMidplanes(d3.select(this));
    });
  }

  function renderMachinesL2() {
    $("#machineView .Q").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderIODrawers(d3.select(this));
    });

    $("#machineView .RM").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderNodeBoards(d3.select(this));
    });
  }

  function renderMachinesL1() {
    $("#machineView .R").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderBulkPowerSupply(d3.select(this));
      renderClockCard(d3.select(this));
      renderCoolantMonitor(d3.select(this));
    });

    $("#machineView .RM").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderServiceCard(d3.select(this));
    });
  }

  function renderMachinesL0() {
    $("#machineView .RMN").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderComputeCards(d3.select(this));
      renderLinkModules(d3.select(this));
      renderOpticalModules(d3.select(this));
      renderDCAs(d3.select(this));
    });

    $("#machineView .RB").filter(function() {
      return AABB.collide($(this)[0], $("#machineViewSvg")[0]);
    }).each(function() {
      renderPowerModules(d3.select(this));
    });
  } */

  function renderRacks() {
    for (row=0; row<3; row++) {
      transformer.push([0, (rackH+rackPadding*2)*row]);
      for (col=0; col<16; col++) {
        var rackStr = mira.rack2str(row, col);
        transformer.push([(rackW+rackPadding*2)*col + rackPadding, rackPadding]);
        printElement(rackStr, 4, transformer.zero(), rackW, rackH, 0.5, 2, 8, 8, rackStr);
        renderBulkPowerSupply(row, col);
        renderClockCard(row, col);
        renderCoolantMonitor(row, col);
        renderMidplanes(row, col);
        transformer.pop();
      }

      for (col=16; col<18; col++) {
        var ioRackStr = mira.ioRack2str(row, col);
        transformer.push([(rackW+rackPadding*2)*col + rackPadding, rackPadding]);
        printElement(ioRackStr, 4, transformer.zero(), rackW, rackH, 0.5, 2, 8, 8, ioRackStr);
        renderIODrawers(row, col);
        transformer.pop();
      }
      transformer.pop();
    }
  }

  function renderMidplanes(row, col) {
    transformer.push([midplaneGroupL, midplaneGroupT]);
    for (mp=0; mp<2; mp++) {
      var midplaneStr = mira.midplane2str(row, col, mp);
      var midplaneIdx = (row*16+col)*2+mp;
      
      transformer.push([0, (midplaneH+midplanePadding)*mp]);
      printElement(midplaneStr, 3, transformer.zero(), midplaneW, midplaneH, 0.3, 2, 3.8, 3, midplaneStr);
      /* text 3px, 2, 4 */
      renderServiceCard(row, col, mp);
      renderNodeBoards(row, col, mp);
      transformer.pop();
    }
    transformer.pop();
  }

  function renderIODrawers(row, col) {
    transformer.push([ioDrawerGroupL, ioDrawerGroupT]);
    for (p=0; p<3; p++) {
      for (q=0; q<3; q++) {
        var ioDrawerID = p*3+q;
        var ioDrawerStr = mira.ioDrawer2str(row, col, ioDrawerID);

        transformer.push([q*ioDrawerW, p*ioDrawerH]);
        printElement(ioDrawerStr, 3, transformer.zero(), ioDrawerW, ioDrawerH, 0.3, 2, 4, 3, "I"+ioDrawerID);
        transformer.pop();
      }
    }
    transformer.pop();
  }

  function renderNodeBoards(row, col, mp) {
    transformer.push([nodeBoardGroupL, nodeBoardGroupT]);
    for (var p=0; p<4; p++) {
      for (var q=0; q<4; q++) {
        var nodeBoardID = p*4+q;
        var nodeBoardStr = mira.nodeBoard2str(row, col, mp, nodeBoardID);
        
        transformer.push([q*nodeBoardW, p*nodeBoardH]);
        // printElement(nodeBoardStr, 2, transformer.zero(), nodeBoardW, nodeBoardH, 0.1, 0.5, 1.25, 1, "N"+mira.pad(nodeBoardID, 10, 2));
        printElement(nodeBoardStr, 2, transformer.zero(), nodeBoardW, nodeBoardH, 0.1, 0.5, 1.25, 0, "N"+mira.pad(nodeBoardID, 10, 2));
        renderComputeCards(row, col, mp, nodeBoardID);
        renderLinkModules(row, col, mp, nodeBoardID);
        renderOpticalModules(row, col, mp, nodeBoardID);
        renderDCAs(row, col, mp, nodeBoardID);
        transformer.pop();
      }
    }
    transformer.pop();
  }
  
  function renderComputeCards(row, col, mp, nb) {
    transformer.push([computeCardGroupL, computeCardGroupT]);
    for (var p=0; p<4; p++) {
      for (var q=0; q<8; q++) {
        var computeCardID = p*8+q;
        var computeCardStr = mira.computeCard2str(row, col, mp, nb, computeCardID);

        transformer.push([q*computeCardW, p*computeCardH]);
        printElement(computeCardStr, 0, transformer.zero(), computeCardW, computeCardH, 0.05, 0.25, 0.4, 0.25, "J"+mira.pad(computeCardID, 10, 2));
        transformer.pop();
      }
    }
    transformer.pop();
  }
  
  function renderLinkModules(row, col, mp, nb) {
    transformer.push([linkModuleGroupL, linkModuleGroupT]);

    for (p=0; p<3; p++) {
      for (q=0; q<3; q++) {
        var linkModuleID = p*3+q;
        var linkModuleStr = mira.linkModule2str(row, col, mp, nb, linkModuleID);

        transformer.push([q*linkModuleW, p*linkModuleH]);
        printElement(linkModuleStr, 0, transformer.zero(), linkModuleW, linkModuleH, 0.05, 0.45, 0.6, 0.25, "U"+linkModuleID);
        transformer.pop();
      }
    }
    transformer.pop();
  }

  function renderOpticalModules(row, col, mp, nb) {
    transformer.push([opticalModuleGroupL, opticalModuleGroupT]);

    for (p=0; p<6; p++) {
      for (q=0; q<6; q++) {
        var opticalModuleID = p*6+q;
        var opticalModuleStr = mira.opticalModule2str(row, col, mp, nb, opticalModuleID);
        transformer.push([q*opticalModuleW, p*opticalModuleH]);
        printElement(opticalModuleStr, 0, transformer.zero(), opticalModuleW, opticalModuleH, 0.05, 0.05, 0.4, 0.25, "O"+mira.pad(opticalModuleID, 10, 2));
        transformer.pop();
      }
    }
    transformer.pop();
  }

  function renderServiceCard(row, col, mp) {
    var serviceCardStr = mira.serviceCard2str(row, col, mp);
    transformer.push([serviceCardL, serviceCardT]);
    printElement(serviceCardStr, 2, transformer.zero(), serviceCardW, serviceCardH, 0.2, 3.3, 2.25, 2, "S");
    transformer.pop();
  }

  function renderBulkPowerSupply(row, col) {
    transformer.push([bulkPowerSupplyGroupL, bulkPowerSupplyGroupT]);

    for (var p=0; p<2; p++) {
      for (var q=0; q<2; q++) {
        var bulkPowerSupplyID = p*2+q;
        var bulkPowerSupplyStr = mira.bulkPowerSupply2str(row, col, bulkPowerSupplyID);
        transformer.push([q*bulkPowerSupplyW, p*bulkPowerSupplyH]);
        printElement(bulkPowerSupplyStr, 1, transformer.zero(), bulkPowerSupplyW, bulkPowerSupplyH, 0.2, 0.9, 1.8, 1, "B"+bulkPowerSupplyID);
        renderPowerModules(row, col, bulkPowerSupplyID);
        transformer.pop();
      }
    }
    transformer.pop();
  }
  
  function renderPowerModules(row, col, bps) {
    transformer.push([powerModuleGroupL, powerModuleGroupT]);

    for (var p=0; p<3; p++) {
      for (var q=0; q<3; q++) {
        var powerModuleID = p*3+q;
        var powerModuleStr = mira.powerModule2str(row, col, bps, powerModuleID);
        transformer.push([q*powerModuleW, p*powerModuleH]);
        printElement(powerModuleStr, 0, transformer.zero(), powerModuleW, powerModuleH, 0.05, 0.05, 0.4, 0.25, "P"+powerModuleID);
        transformer.pop();
      }
    }
    transformer.pop();
  }

  function renderClockCard(row, col) {
    var clockCardStr = mira.clockCard2str(row, col);
    transformer.push([clockCardL, clockCardT]);
    printElement(clockCardStr, 1, transformer.zero(), clockCardW, clockCardH, 0.2, 1.1, 1.8, 1, "K");
    transformer.pop();
  }

  function renderCoolantMonitor(row, col) {
    var coolantMonitorStr = mira.coolantMonitor2str(row, col);
    transformer.push([coolantMonitorL, coolantMonitorT]);
    printElement(coolantMonitorStr, 1, transformer.zero(), coolantMonitorW, coolantMonitorH, 0.2, 1.1, 1.8, 1, "L");
    transformer.pop();
  }
  
  function renderDCAs(row, col, mp, nb) {
    transformer.push([DCAGroupT, DCAGroupT]);
    for (p=0; p<2; p++) {
      var DCAID = p;
      var DCAStr = mira.DCA2str(row, col, mp, nb, DCAID);
      transformer.push([p*DCAW, 0]);
      printElement(DCAStr, 0, transformer.zero(), DCAW, DCAH, 0.05, 0.6, 0.7, 0.5, "D"+DCAID);
      transformer.pop();
    }
    transformer.pop();
  }

}

machineView();

// createMachineView();
// highlightBlock("MIR-00000-73FF1-16384");
