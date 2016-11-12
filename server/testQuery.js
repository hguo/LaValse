var MongoClient = require("mongodb").MongoClient, 
    assert = require("assert");

var url = "mongodb://localhost:27017/catalog";

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("connected.");

  findDocument(db, function() {
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
  db.collection("mira").find({EVENT_TIME: {$gte: new Date(2015, 10, 20), $lt: new Date(2015, 10, 25)}}).toArray(function(err, docs) {
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
  var collection = db.collection("mira");
  collection.aggregate([
      {$match: {"SEVERITY": "FATAL"}}, 
      {$group: {_id: "$MSG_ID", "count": {$sum: 1}}}
  ], function(err, result) {
    console.log(result);
    callback(result)
  });
}
