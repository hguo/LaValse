const fs = require("fs");
const levelup = require("levelup");
const csv = require("fast-csv");
const assert = require("assert");
const mira = require("./mira");
const rasbook = require("./rasbook");

var db = levelup("./db2");

var stream = fs.createReadStream(process.argv[2]);

var csvStream = csv({headers: true})
  .on("data", function(d) {
    console.log(d);
  })
  .on("end", function() {
  });

stream.pipe(csvStream);
