const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const txt = require("../text/textexport_ita");
const statupdown=[
  [
    {text:txt.forz+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifystat",stat:"forz",dir:"up"  })},
    {text:txt.forz+" : \xE2\xAC\x87:", callback_data: JSON.stringify({action:"modifystat",stat:"forz",dir:"down"  })}
  ],
  [
    {text:txt.dex+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifystat",stat:"dex",dir:"up"  })},
    {text:txt.dex+" : \xE2\xAC\x87", callback_data: JSON.stringify({action:"modifystat",stat:"dex",dir:"down"  })}
  ],
  [
    {text:txt.inte+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifystat",stat:"inte",dir:"up"  })},
    {text:txt.inte+" : \xE2\xAC\x87", callback_data: JSON.stringify({action:"modifystat",stat:"inte",dir:"down"  })}
  ],
  [
    {text:txt.cari+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifystat",stat:"cari",dir:"up"  })},
    {text:txt.cari+" : \xE2\xAC\x87:", callback_data: JSON.stringify({action:"modifystat",stat:"cari",dir:"down"  })}
  ],
  [
    {text:txt.conferma, callback_data: JSON.stringify({action:"createusr", confirm:true })},
  ]
];

var sem = require('semaphore')(1);




function modifystat(query,data,next){
  var reply = bot.reply(query.message.chat);
  db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(user){
    if(!user){
      return next();
    }
    if(user.phase==2){
      var tot=15;
      var totdisp=tot-(user.forz+user.dex+user.inte+user.cari);
      var x={};
      x[data.stat]=user[data.stat];
      if(data.dir=="up"&&totdisp>0){
        x[data.stat]=x[data.stat]+1;
        db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
          db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
            totdisp=tot-(userm.forz+userm.dex+userm.inte+userm.cari);
            sem.take(function(){
              reply.inlineKeyboard(statupdown).editHTML(query.message,txt.createpgcase2+totdisp+txt.forz+userm.forz+txt.dex+userm.dex+txt.inte+userm.inte+txt.cari+userm.cari).then(setTimeout(sem.leave,1500));
            });
          });
        });
      }
      else if(data.dir=="down"&&x[data.stat]>0){
        x[data.stat]=x[data.stat]-1;
        db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
          db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
            totdisp=tot-(userm.forz+userm.dex+userm.inte+userm.cari);
            sem.take(function(){
              reply.inlineKeyboard(statupdown).editHTML(query.message,txt.createpgcase2+totdisp+txt.forz+userm.forz+txt.dex+userm.dex+txt.inte+userm.inte+txt.cari+userm.cari).then(setTimeout(sem.leave,1500));
            });
          });
        });
      }
      else{
        sem.take(function(){
          reply.inlineKeyboard(statupdown).editHTML(query.message,txt.createpgcase2+totdisp+txt.forz+user.forz+txt.dex+user.dex+txt.inte+user.inte+txt.cari+user.cari).then(setTimeout(sem.leave,1500));
        });
      }
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
          reply.inlineKeyboard(statupdown).html(txt.createpgcase2+"15"+txt.forz+"0"+txt.dex+"0"+txt.inte+"0"+txt.cari+"0");
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
  console.log("1.a");
  if(msg.chat.type!="user"){
    console.log("1.b");
   return next();
  }
  db.readfilefromdb("Users", {id:msg.from.id,ready:false}).then(function(user){
    if(!user){
      console.log("1.c");
      return next();
    }
    console.log("1.d");
    var replyto = bot.reply(msg.from.id);
    switch (user.phase) {
      case 0:
        console.log("1.e");
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

module.exports={
  modifystat,
  createusrquery,
  createusr
}
