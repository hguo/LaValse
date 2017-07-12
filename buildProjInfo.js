const MongoClient = require("mongodb").MongoClient;
const uri = "mongodb://localhost:27017/catalog1";

const colors = ["", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
var str = "🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍈 🍒 🍑 🍍 🥝 🥑 🍅 🍆 🥒 🥕 🌽 🌶 🥔 🍠 🌰 🥜 🍯 🥐 🍞 🥖 🧀 🥚 🍳 🥓 🥞 🍤 🍗 🍖 🍕 🌭 🍔 🍟 🥙 🌮 🌯 🥗 🥘 🍝 🍜 🍲 🍥 🍣 🍱 🍛 🍚 🍙 🍘 🍢 🍡 🍧 🍨 🍦 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🥛 🍼 ☕️ 🍵 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🍾 🥄 🍴 🍽";
var emojis = str.split(" ");

var aliases = [];
for (var i=0; i<colors.length; i++) {
  for (var j=0; j<emojis.length; j++) {
    aliases.push([colors[i], emojis[j]]);
  }
}

MongoClient.connect(uri, function(err, db) {
  buildUserInfo(db, function() {
    db.close();
  });
});

var buildUserInfo = function(db, cb) {
  var collection = db.collection("cobalt");
  collection.aggregate([
        {
          $group: {"_id": "$projectName", count: {$sum: 1}}
          // $group: {"_id": "$cobaltUserName", count: {$sum: 1}}
          // $group: {"_id": "$machinePartition", count: {$sum: 1}}
        }
    ])
    .toArray(function(err, docs) {
      for (var i=0; i<docs.length; i++) {
        console.log('"' + docs[i]._id + '","' + aliases[i][0] + '","' +  aliases[i][1] + '"');
      }
    });
  cb();
}
