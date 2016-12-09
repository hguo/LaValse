module.exports = {
  parse: function(messageID, message) {
    var pattern = rasbook[messageID].message;
    var p = new Parser(pattern);
    var results = p.parse(message);
    if (results == undefined) {
      console.log(pattern);
      console.log(message);
    }
    return results; // p.parse(message);
  }
}

//// sqy
function Parser(pattern) {
  var _pattern = pattern;
  var _keyRegex = /\$\([A-Za-z_% ,0-9]+\)/g;
  var _keys = _pattern.match(_keyRegex);
  var _types = [];

  var typeMap = {
    'd': 'INT', 
    's': 'STRING',
    'f': 'FLOAT'
  };
  for (var i in _keys) {
    var typeIndex = _keys[i].indexOf('%');
    var type;
    if (typeIndex === -1) { // no given type
      _keys[i] = _keys[i].match(/[A-Za-z_0-9]+/g)[0];
      type = 'string';
    }
    else {
      var typeChar = _keys[i][typeIndex+1];
      type = typeMap[typeChar];
      _keys[i] = _keys[i].substr(typeIndex+2).match(/[A-Za-z_0-9]+/g)[0];
    }
    _types.push(type);
  }

  var tmp = _pattern.replace(_keyRegex, '________');
  tmp = tmp.replace(/\(/g, '\\(');
  tmp = tmp.replace(/\)/g, '\\)');
  tmp = tmp.replace(/\[/g, '\\[');
  tmp = tmp.replace(/\]/g, '\\]');
  var _regex = new RegExp(tmp.replace(/________/g, '(.*)'));

  return {
    parse: function(str) {
      if (_regex.test(str) === false) {
        console.log('Parse fail: wrong input pattern');
        return;
      }
      var obj = {};
      var i;
      var matchString = '';
      if (_keys === null || _keys === undefined || _keys.length === 0) _keys = [];
      for (i = 1; i <= _keys.length; i ++) {
        matchString += '$' + i;
        if (i !== _keys.length) matchString += '/';
      }
      var tmpRes = str.replace(_regex, matchString);
      var tmpList = tmpRes.split('/');
      for (i = 0; i < _keys.length; i ++) {
        var key = _keys[i];
        obj[key] = tmpList[i];
        if (_types[i] === 'INT') {
          obj[key] = Number.parseInt(obj[key]);
        }
        else if (_types[i] === 'FLOAT') {
          obj[key] = Number(obj[key]);
        }
      }
      return obj;
    }, 
    pattern: _pattern,
    keys: _keys,
    regex: _regex,
    types: _types
  };
}

function test() {
  function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
      console.log('isEquivalent: wrong length');
        return false;
    }

    for (var key in a) {
        // If values of same property are not equal,
        // objects are not equivalent
        if (a[key] !== b[key]) {
          console.log('isEquivalent: propname = ' + key);
          console.log('isEquivalent: a = ' + a[key]);
          console.log('isEquivalent: b = ' + b[key]);
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
  }

  function outputResult(result, expected, testTitle) {
    if (isEquivalent(result, expected) === false) {
      console.error('test ' + testTitle +' fail');
      console.info('expected: ');
      console.log(expected);
      console.info('output: ');
      console.log(result);
    }
    else console.info('test ' + testTitle + ' passed');
  }

  var result;
  var expected;

  // Test 1
  var p1 = new Parser('Cable from $(FROMPORT) to $(TOPORT) on $(CARD_TYPE) $(BG_LOC) contains bad wires. $(ERROR_DATA)');
  result = p1.parse('Cable from R2E-M0-N10-T04 to R26-M0-N10-T06 on NodeBoard R2E-M0-N10 contains bad wires. Cable is bad with 4 broken wires (0x000000704000)');
  expected = { 
    BG_LOC: "R2E-M0-N10",
    CARD_TYPE: "NodeBoard",
    ERROR_DATA: "Cable is bad with 4 broken wires (0x000000704000)",
    FROMPORT: "R2E-M0-N10-T04",
    TOPORT: "R26-M0-N10-T06"
  };
  outputResult(result, expected, 1);

  // Test 2
  var p2 = new Parser('There were $(%d, COUNT) similar events. Elapsed time = $(%f, SEC) seconds. Error message: $(%s, MSG).');
  result = p2.parse('There were 102 similar events. Elapsed time = 0.0018 seconds. Error message: abracadabra.');
  expected = {
    COUNT: 102,
    MSG: "abracadabra",
    SEC: 0.0018
  };
  outputResult(result, expected, 2);


  // Test 3
  var p3 = new Parser('Some messages: $(MSG)');
  outputResult(p3.parse('Some messages: "here are some messages"'), {MSG: '"here are some messages"'}, 3.1);
  outputResult(p3.parse('Some messages: (here are some messages)'), {MSG: "(here are some messages)"}, 3.2);
  outputResult(p3.parse('Some messages: apple: poison'), {MSG: "apple: poison"}, 3.3);
  outputResult(p3.parse('Some messages: 2014-01-01'), {MSG: "2014-01-01"}, 3.4);
  outputResult(p3.parse('Some messages: [some words]'), {MSG: "[some words]"}, 3.5);

  // Test 4
  var p4 = new Parser('ND Sender Retransmission Correctable Error : $(LINK) count=$(%d,COUNT) $(DETAILS)');
  result = p4.parse('ND Sender Retransmission Correctable Error : link count=3 '); 
  expected = {COUNT: 3, LINK: "link", DETAILS: ""};
  outputResult(result, expected, 4);

  // Test 5
  var p5 = new Parser('DDR Maintenance Correctable Error Summary : $(DETAILS)');
  result = p5.parse('DDR Maintenance Correctable Error Summary : count=10000 MCFIR error status:  [ECC_ERROR_COUNTER_THRESHOLD_REACHED] ;');
  expected = {DETAILS: "count=10000 MCFIR error status:  [ECC_ERROR_COUNTER_THRESHOLD_REACHED] ;"};
  outputResult(result, expected, 5);

  // Test 6
  var p6 = new Parser('A link chip did not bit align along the receiver C port: $(STATUS). The control system will attempt to replace the failing lane(s) with spare(s).');
  result = p6.parse('A link chip did not bit align along the receiver C port:  Expected: 0xffffff0000000000 Actual: 0xf7ffff0000000000. The control system will attempt to replace the failing lane(s) with spare(s).');
  expected = {STATUS: " Expected: 0xffffff0000000000 Actual: 0xf7ffff0000000000"};
  outputResult(result, expected, 6);

  // Test 7
  var p7 = new Parser('[BOOT] The specified BG Linux Distribution path is missing or invalid:  $(DETAILS)');
  result = p7.parse('[BOOT] The specified BG Linux Distribution path is missing or invalid:  Unable to access the specified BG Linux Distribution .5_V1R2M2-6 due to previous errors.');
  expected = {DETAILS: 'Unable to access the specified BG Linux Distribution .5_V1R2M2-6 due to previous errors.'};
  outputResult(result, expected, 7);

  // Test 8 
  var p8 = new Parser('A2 TLB Parity Error : MMUCR1=$(MMUCR1) MCSR=$(MCSR) : $(MCSR_DETAILS)');
  result = p8.parse('A2 TLB Parity Error : MMUCR1=0x000000000C0503ED MCSR=0x0000000000000002 : (TLBPE) TLB Parity Error');
  expected = {MMUCR1: '0x000000000C0503ED', MCSR: '0x0000000000000002', MCSR_DETAILS: '(TLBPE) TLB Parity Error'};
  outputResult(result, expected, 8);
}

// test();
