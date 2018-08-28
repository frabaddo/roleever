const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const txt = require("../text/textexport_ita");
const statupdown=[
  [
    {text:txt.forz+" :arrow_up:", callback_data: JSON.stringify({action:"modifystat",stat:"forz",dir:"up"  })},
    {text:txt.forz+" :arrow_down:", callback_data: JSON.stringify({action:"modifystat",stat:"forz",dir:"down"  })}
  ],
  [
    {text:txt.dex+" :arrow_up:", callback_data: JSON.stringify({action:"modifystat",stat:"dex",dir:"up"  })},
    {text:txt.dex+" :arrow_down:", callback_data: JSON.stringify({action:"modifystat",stat:"dex",dir:"down"  })}
  ],
  [
    {text:txt.inte+" :arrow_up:", callback_data: JSON.stringify({action:"modifystat",stat:"inte",dir:"up"  })},
    {text:txt.inte+" :arrow_down:", callback_data: JSON.stringify({action:"modifystat",stat:"inte",dir:"down"  })}
  ],
  [
    {text:txt.cari+" :arrow_up:", callback_data: JSON.stringify({action:"modifystat",stat:"cari",dir:"up"  })},
    {text:txt.cari+" :arrow_down:", callback_data: JSON.stringify({action:"modifystat",stat:"cari",dir:"down"  })}
  ],
  [
    {text:txt.conferma, callback_data: JSON.stringify({action:"createusr", confirm:true })},
  ]
];


function modifystat(query,data,next){
  var reply = bot.reply(query.message.chat);
  db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(user){
    if(!user){
      return next();
    }
    if(user.phase==2){
      if(data.dir=="up"){
        db.modifyobj("Users",{
          eval("data.stat") : user[data.stat]+1,
        },{ id: query.from.id , ready:false});
      }
      else if(data.dir=="down"){
        var x={};
        x[data.stat]=user[data.stat]-1;
        db.modifyobj("Users",x,{ id: query.from.id , ready:false});
      }
      reply.editHTML(query.message,txt.createpgcase2+txt.forz+user.forz+txt.dex+user.dex+txt.inte+user.inte+txt.cari+user.cari);
    }
    else{
      support.deletecmd(reply,query.message);
    }
  });
}


function createusrquery(query,data,next){
  if(query.message.chat.type!="user"){
   return next();
  }
  var reply = bot.reply(query.message.chat);
  db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(user){
    if(!user){
      return next();
    }
    switch (user.phase) {
      case 0:
        if(data.ys){
          db.modifyobj("Users",{
            charactername: query.message.text.replace(txt.addthisname,""),
            phase:1
          },{ id: query.from.id , sessionid: data.sid});
          support.deletecmd(query.message.id,reply);
          reply.text(txt.createpgcase1);
        }else{
          support.deletecmd(query.message.id,reply);
          reply.text(txt.createpgcase0);
        }
        break;
      case 1:
        if(data.ys){
          db.modifyobj("Users",{
            characterdescription: query.message.text.replace(txt.addthisdescription,""),
            forz:0,dex:0,inte:0,cari:0,
            phase:2
          },
          { id: query.from.id , sessionid: data.sid}
        );
          reply.inlineKeyboard(statupdown).html(txt.createpgcase2+txt.forz+"0"+txt.dex+"0"+txt.inte+"0"+txt.cari+"0");
        }else{
          reply.text(txt.createpgcase1);
        }
        support.deletecmd(query.message.id,reply);
        break;
      case 2:
        break;
      case 3:
        break;
      default:
        break;
    }
  });
}


function createusr(msg,reply,next){
  if(msg.chat.type!="user"){
   return next();
  }
  db.readfilefromdb("Users", {id:msg.from.id,ready:false}).then(function(user){
    if(!user){
      return next();
    }
    var replyto = bot.reply(msg.from.id);
    switch (user.phase) {
      case 0:
        replyto.inlineKeyboard([
          [{text:txt.yes, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: true })},{text:txt.no, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: false })}]
        ]).html(txt.addthisname+msg.text);
        break;
      case 1:
        replyto.inlineKeyboard([
          [{text:txt.yes, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: true })},{text:txt.no, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: false })}]
        ]).html(txt.addthisdescription+msg.text);
        break;
      case 2:
        break;
      case 3:
        break;
      default:
        break;
    }
  });
}
