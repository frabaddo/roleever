const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const txt = require("../text/textexport_ita");

var pkey=function(id){
  return [
    [
      {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: chatid})},
      {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
    ],
    [
      {text:"Add Roll", callback_data: JSON.stringify({ action: "addroll", chatid: chatid})}
    ]
  ];
}
var addstatkey=function(id){
  return [
    [{text:txt.forz, callback_data: JSON.stringify({ action: "addappr", s:1,chatid:id})}],
    [{text:txt.dex, callback_data: JSON.stringify({ action: "addappr", s:2,chatid: id })}],
    [{text:txt.inte, callback_data: JSON.stringify({ action: "addappr", s:3,chatid: id})}],
    [{text:txt.cari, callback_data: JSON.stringify({ action: "addappr", s:4,chatid: id})}],
    [{text:"back", callback_data: JSON.stringify({ action: "back",chatid: chatid})}],
  ];
}

var addapprkey=function(i,id){
  var key=[
    [{text:txt.appr1, callback_data: JSON.stringify({ action: "confirm", s:i,a:1,chatid: id})}],
    [{text:txt.appr2, callback_data: JSON.stringify({ action: "confirm", s:i,a:2,chatid: id})}],
    [{text:txt.appr3, callback_data: JSON.stringify({ action: "confirm", s:i,a:3,chatid: id})}],
    [{text:txt.appr4, callback_data: JSON.stringify({ action: "confirm", s:i,a:4,chatid: id})}],
    [{text:txt.appr5, callback_data: JSON.stringify({ action: "confirm", s:i,a:5,chatid: id})}],
    [{text:txt.appr6, callback_data: JSON.stringify({ action: "confirm", s:i,a:6,chatid: id})}],
    [{text:txt.dex, callback_data: JSON.stringify({ action: "back",chatid: chatid})}],
  ];
  return key;
}

var addroll = function(query,data){
  var key=addstatkey(data.chatid);
  reply.inlineKeyboard(key).editHTML(query.message.text);
}


var back = function(query){
  var key=pkey(data.chatid);
  reply.inlineKeyboard(key).editHTML(query.message.text);
}

var addappr = function(query,data){
  var key=addapprkey(data.s,data.chatid);
  reply.inlineKeyboard(key).editHTML(query.message.text);
}

var confirm = function(query,data){
  var stat=["forz","dex","inte","cari"];
  var approc=["appr1","appr2","appr3","appr4","appr5","appr6"];
  db.readfilefromdb("Users",{sessionid : data.chatid,id:query.from.id}).then(function(user){
    if(user){
      var key=addstatkey(data.chatid);
      var d10=Math.floor((Math.random() * 10) + 1);
      var roll=d10+user[stat[data.s]]+user[approc[data.a]];
      var texttosend=query.message.text+"\n\n"+"1d10 + "+stat[data.s]+" + "+approc[data.a]+" = "+roll;
      reply.inlineKeyboard(key).editHTML(texttosend);
    }
  });
}
