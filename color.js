var MongoClient = require("mongodb").MongoClient;
var uri = "mongodb://localhost:27017/catalog";

MongoClient.connect(uri, function(err, db) {
  var cursor = db.collection("cobalt").find();

  cursor.each(function(err, item) {
    console.log(item);
  });
});
