const MongoClient = require("mongodb").MongoClient;

function conv(collection, varNames) {
  varNames.forEach(function(varName) {
    collection.aggregate([
        {
          $group: {"_id": "$"+varName, count: 

}
