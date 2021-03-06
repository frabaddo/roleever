const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const msgapi=require("./messageapi");
const txt = require("../text/textexport_ita");

var pkey=function(id){
  return [
    [
      {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: id})},
      {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
    ],
    [
      {text:"Add Roll", callback_data: JSON.stringify({ action: "addroll", chatid: id})}
    ]
  ];
};
var addstatkey=function(id){
  return [
    [{text:txt.forz, callback_data: JSON.stringify({ action: "addappr", s:1,chatid:id})}],
    [{text:txt.dex, callback_data: JSON.stringify({ action: "addappr", s:2,chatid: id })}],
    [{text:txt.inte, callback_data: JSON.stringify({ action: "addappr", s:3,chatid: id})}],
    [{text:txt.cari, callback_data: JSON.stringify({ action: "addappr", s:4,chatid: id})}],
    [{text:"back", callback_data: JSON.stringify({ action: "back",chatid: id})}],
  ];
};

var addapprkey=function(i,id){
  var key=[
    [{text:txt.appr1, callback_data: JSON.stringify({ action: "confirm", s:i,a:1,chatid: id})}],
    [{text:txt.appr2, callback_data: JSON.stringify({ action: "confirm", s:i,a:2,chatid: id})}],
    [{text:txt.appr3, callback_data: JSON.stringify({ action: "confirm", s:i,a:3,chatid: id})}],
    [{text:txt.appr4, callback_data: JSON.stringify({ action: "confirm", s:i,a:4,chatid: id})}],
    [{text:txt.appr5, callback_data: JSON.stringify({ action: "confirm", s:i,a:5,chatid: id})}],
    [{text:"back", callback_data: JSON.stringify({ action: "back",chatid: id})}],
  ];
  return key;
};

var addroll = function(query,data){
  var reply = bot.reply(query.message.chat);
  var key=addstatkey(data.chatid);
  setTimeout(function(){reply.inlineKeyboard(key).editMarkdown(query.message,query.message.text); }, 800);
};


var backfunc = function(query,data){
  var reply = bot.reply(query.message.chat);
  var key=pkey(data.chatid);
  setTimeout(function(){reply.inlineKeyboard(key).editMarkdown(query.message,query.message.text); }, 800);
};

var addappr = function(query,data){
  var reply = bot.reply(query.message.chat);
  var key=addapprkey(data.s,data.chatid);
  setTimeout(function(){reply.inlineKeyboard(key).editMarkdown(query.message,query.message.text); }, 800);
};

var confirmfunc = function(query,data){
  var reply = bot.reply(query.message.chat);
  var stat=["forz","dex","inte","cari"];
  var approc=["appr1","appr2","appr3","appr4","appr5"];
  db.readfilefromdb("Users",{sessionid : data.chatid,id:query.from.id}).then(function(user){
    if(user){
      var key=pkey(data.chatid);
      var d10=Math.floor((Math.random() * 10) + 1);
      var roll=d10+user[stat[data.s-1]]+user[approc[data.a-1]];
      var texttosend=query.message.text+"\n\n"+"*1d10 + "+txt[stat[data.s-1]]+" + "+txt[approc[data.a-1]]+" = "+roll+"*";
      setTimeout(function(){reply.inlineKeyboard(key).editMarkdown(query.message,texttosend); }, 800);
    }
  });
};

var makedamage=function(query,data){
  db.readfilefromdb("Users", {sessionid:data.chatid},true).then(function(users){
    var user=users.find(x => x.id == data.id);
    db.readfilefromdb("Sessions", {id:data.chatid}).then(function(session){
      if(user&&session&&session.messagedamage==query.message.id&&(user.pf-session.playersdamage[data.id]>0)){
        var damage=session.playersdamage;
        damage[data.id]+=1;
        db.modifyobj(
          "Sessions",
          {
            playersdamage:damage
          },
          {id:data.chatid}
        );
        var reply = bot.reply(query.message.chat);
        var key=msgapi.masterplayerkeyboard(data.chatid,query.from.id,users);
        reply.inlineKeyboard(key).editMarkdown(query.message,query.message.text+"\n\n"+user.charactername+": -1pf");
      }
    });
  });
};

var healdamage=function(query,data){
  db.readfilefromdb("Users", {sessionid:data.chatid},true).then(function(users){
    var user=users.find(x => x.id == data.id);
    db.readfilefromdb("Sessions", {id:data.chatid}).then(function(session){
      if(user&&session&&session.messagedamage==query.message.id&&(user.pf-session.playersdamage[data.id]<99)){
        var damage=session.playersdamage;
        damage[data.id]-=1;
        db.modifyobj(
          "Sessions",
          {
            playersdamage:damage
          },
          {id:data.chatid}
        );
        var reply = bot.reply(query.message.chat);
        var key=msgapi.masterplayerkeyboard(data.chatid,query.from.id,users);
        reply.inlineKeyboard(key).editMarkdown(query.message,query.message.text+"\n\n"+user.charactername+": +1pf");
      }
    });
  });
};

module.exports={
  addroll,
  backfunc,
  addappr,
  confirmfunc,
  makedamage,
  healdamage
};
