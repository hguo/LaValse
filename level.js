app.get("/db", function(req, res) {
  var query = JSON.parse(req.query.query); // query should be an array
  var results = {};
  var resultsArray = [];

  query.forEach(function(key) {
    rasdb.get(key, function(err, val) {
      results[key] = val;
      callback();
    });
  });

  var count = 0;
  function callback() {
    count ++;
    if (count == query.length) {
      query.forEach(function(key) {
        resultsArray.push(JSON.parse(results[key]));
      });
      res.end(JSON.stringify(resultsArray));
    }
  }
});
