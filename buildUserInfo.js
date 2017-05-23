const MongoClient = require("mongodb").MongoClient;
const uri = "mongodb://localhost:27017/catalog1";

const colors = ["", "#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6"];
var str = "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐒 🐔 🐧 🐦 🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐚 🐞 🐜 🕷 🕸 🐢 🐍 🦎 🦂 🦀 🦑 🐙 🦐 🐠 🐟 🐡 🐬 🦈 🐳 🐋 🐊 🐆 🐅 🐃 🐂 🐄 🦌 🐪 🐫 🐘 🦏 🦍 🐎 🐖 🐐 🐏 🐑 🐕 🐩 🐈 🐓 🦃 🕊 🐇 🐁 🐀 🐿 🐉 🐲 ⛄️ 🤡 👻 👹 👺 👽 🎃 👾 🤖 🎃 ⚽️ 🏀 🏈 ⚾️ 🎾 🏐 🏉 🎱 🏓 🏸 🎤 🎹 🥁 🎷 🎺 🎸 🎻 🎲 🎯 🎳 🎮 🎰 🚗 🚕 ⌚️ 💽 🖨 💾 🎥 📺 📻 🎙 ⏰ 🛢 💎 🔧 🔨 🔩 ⚙️ 💣 🔮 🔬 💊 💉 🛎 🔑 🎁 🎈 📦 📯 🖌 ✂️ ✏️ 🖍 🔒 🀄️ 🃏 ♠️ ♣️ ♥️ ♦️ 📎 📚 🚀 🛰 💺 ⛵️ 🛥 ⛽️";
var emojis = str.split(" ");

var aliases = [];
for (var i=0; i<colors.length; i++) {
  for (var j=0; j<emojis.length; j++) {
    aliases.push([colors[i], emojis[j]]);
  }
}

MongoClient.connect(uri, function(err, db) {
  buildUserInfo(db, function() {
  });
});

var buildUserInfo = function(db, cb) {
  var collection = db.collection("cobalt");
  collection.aggregate([
        {
          // $group: {"_id": "$cobaltProjectName", count: {$sum: 1}}
          $group: {"_id": "$cobaltUserName", count: {$sum: 1}}
          // $group: {"_id": "$machinePartition", count: {$sum: 1}}
        }
    ])
    .toArray(function(err, docs) {
      // console.log(err);
      // docs.forEach(function(x) {console.log(x);});
      for (var i=0; i<docs.length; i++) {
        console.log('"' + docs[i]._id + '","' + aliases[i][0] + '","' +  aliases[i][1] + '"');
      }
      db.close();
    });
  cb();
}
