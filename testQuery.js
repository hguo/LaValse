var MongoClient = require("mongodb").MongoClient, 
    assert = require("assert");

var url = "mongodb://localhost:27017/catalog";

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  // console.log("connected.");

  // findDocument(db, function() {
  aggregateDocument(db, function() {
    db.close();
  });
});

var insertDocuments = function(db, callback) {
  var collection = db.collection("mydoc");
  collection.insertMany(
      [{a: 1}, {a: 2}, {a: 3}], 
      function(err, result) {
        console.log(err);
        console.log(result);
        callback(result)
      });
}

var findDocument = function(db, callback) {
  db.collection("mira").find({
      severity: "FATAL",
      eventTime: {$gte: new Date("8/20/2015"), $lt: new Date("8/30/2015")}
    }).toArray(function(err, docs) {
      assert.equal(err, null);
      console.log(docs);
      callback(docs);
    });
}

var updateDocument = function(db, callback) {
  var collection = db.collection("mydoc");
  collection.updateOne(
      {a: 2}, 
      {$set: {b: 1}},
      function(err, result) {
        assert.equal(err, null);
        console.log(result);
        callback(result);
      });
}

var removeDocument = function(db) {
  var collection = db.collection("mydoc");
  collection.deleteOne(
      {a: 3}, 
      function(err, result) {
        console.log(result);
      });
}

var aggregateDocument = function(db, callback) {
  var collection = db.collection("cobalt");
  /* 
  collection.aggregate([ // aggregate by messageID
      {$match: {"severity": "FATAL"}}, 
      {$group: {_id: "$messageID", "count": {$sum: 1}}}
  ], function(err, result) {
    console.log(result);
    callback(result)
  });
  */ 
  /*
  collection.aggregate([ // aggregate by time, different granularities
      {$match: {"severity": "FATAL"}}, 
      // {$group: {_id: {"day": {"$dayOfYear": "$eventTime"}}, count: {$sum: 1}}}
      // {$group: {_id: {"day": {"$dayOfYear": "$eventTime"}, "hour": {"$hour": "$eventTime"}}, count: {$sum: 1}}}
      {$group: {_id: {"day": {"$dayOfYear": "$eventTime"}, "hour": {"$hour": "$eventTime"}, "minute": {"$minute": "$eventTime"}}, count: {$sum: 1}}}
  ], 
  function(err, result) {
    console.log(result);
    callback(result);
  });
  */
  /*
  collection.aggregate([ // projection
      {$match: {"severity": "FATAL"}},
      {$project: {messageID: 1, eventTime: 1}}
  ], 
  function(err, result) {
    console.log(result);
    callback(result);
  });
  */
  /* 
  collection.aggregate([
      {"$match": {"severity": "FATAL"}},
      {"$project": {
          "y": {"$year": "$eventTime"},
          "m": {"$month": "$eventTime"},
          "d": {"$dayOfMonth": "$eventTime"},
          "h": {"$hour": "$eventTime"},
          "messageID": 1}},
      {"$group": {
          "_id": {"year": "$y", "month": "$m", "day": "$d", "hour": "$h"},
          "count": {"$sum": 1}}}
  ], 
  function(err, result) {
    console.log(result);
    callback(result);
  });
  */
  // var query = {"$match": {"severity": "FATAL"}};
  // var group = {"$group": {"_id": "$messageID", "count": {$sum: 1}}};
  
  var a1 = collection
    .aggregate([
        {
          // $group: {"_id": "$cobaltProjectName", count: {$sum: 1}}
          $group: {"_id": "$machinePartition", count: {$sum: 1}}
        }
    ])
    // .find(query)
    .toArray(function(err, docs) {
      docs.forEach(function(d) {
        console.log(d);
      });
    });

  callback();
}
