function Parser(pattern) {
  var _pattern = pattern;
  var _keyRegex = /\$\([A-Za-z_% ,]+\)/g;
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
      _keys[i] = _keys[i].match(/[A-Za-z_]+/g)[0];
      type = 'string';
    }
    else {
      var typeChar = _keys[i][typeIndex+1];
      type = typeMap[typeChar];
      _keys[i] = _keys[i].substr(typeIndex+2).match(/[A-Za-z_]+/g)[0];
    }
    _types.push(type);
  }
  var _regex = new RegExp(_pattern.replace(_keyRegex, '([A-Za-z0-9_\.-]+)'));

  return {
    parse: function(str) {
      if (_regex.test(str) === false) {
        console.log('Parse fail: wrong input pattern');
        return;
      }
      var obj = {};
      var i;
      var matchString = '';
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

// Example 1
var p1 = new Parser('Cable from $(FROMPORT) to $(TOPORT) on $(CARD_TYPE) $(BG_LOC) contains bad wires. $(ERROR_DATA)');
console.log(p1.parse('Cable from R2E-M0-N10-T04 to R26-M0-N10-T06 on NodeBoard R2E-M0-N10 contains bad wires. Cable is bad with 4 broken wires (0x000000704000)'));
// Return: 
// { 
//   BG_LOC: "R2E-M0-N10",
//   CARD_TYPE: "NodeBoard",
//   ERROR_DATA: "Cable is bad with 4 broken wires (0x000000704000)",
//   FROMPORT: "R2E-M0-N10-T04",
//   TOPORT: "R26-M0-N10-T06"
// }


// Example 2
var p2 = new Parser('There were $(%d, COUNT) similar events. Elapsed time = $(%f, SEC) seconds. Error message: $(%s, MSG).');
console.log(p2.parse('There were 102 similar events. Elapsed time = 0.0018 seconds. Error message: abracadabra.'));
// Return: {
//   COUNT: 102,
//   MSG: "abracadabra",
//   SEC: 0.0018,
// }
