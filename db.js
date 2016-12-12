const MongoClient = require("mongodb").MongoClient;

const uri = "mongodb://localhost:27017/catalog";
const collectionName = "mira";

function getRASLog(query, num) {
  MongoClient.connect(uri, function(err, db) {
    if (err != null) return; 
    // TODO
  }
}
