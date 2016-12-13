const MongoClient = require("mongodb").MongoClient;
const async = require("async");

const dbname = "catalog";
const collection = "mira";

function query(query) {
  async.series([
    function(cb) {
      MongoClient.connect(uri, function(err, db) {
        if (err != null) return;
      });
    }
  ]);
}

module.exports = {
  query: query
};
