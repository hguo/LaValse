const MongoClient = require("mongodb").MongoClient;
const mira = require("./mira");

const uri = "mongodb://localhost:27017/catalog";

MongoClient.connect(uri, function(err, db) {
  buildUserInfo(db, function() {
    db.close();
  });
});

var buildUserInfo = function(db, cb) {
  var collection = db.collection("cobalt");
  collection.aggregate([
        {
          $group: {"_id": "$machinePartition", count: {$sum: 1}}
        }
    ])
    .toArray(function(err, docs) {
      docs.forEach(function(d) {
        var array = mira.partitionParser.parse(d._id);
        var str = "";
        array.forEach(function(d) {
          if (d) str += "1";
          else str += "0";
        });
        d.str = str;
        console.log('"' + d._id + '","' + str + '"');
      });
    });
  cb();
}
