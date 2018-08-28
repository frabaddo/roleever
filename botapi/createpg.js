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

const apprupdown=[
  [
    {text:txt.appr1+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifyappr",stat:"appr1",dir:"up"  })},
    {text:txt.appr1+" : \xE2\xAC\x87:", callback_data: JSON.stringify({action:"modifyappr",stat:"appr1",dir:"down"  })}
  ],
  [
    {text:txt.appr2+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifyappr",stat:"appr2",dir:"up"  })},
    {text:txt.appr2+" : \xE2\xAC\x87", callback_data: JSON.stringify({action:"modifyappr",stat:"appr2",dir:"down"  })}
  ],
  [
    {text:txt.appr3+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifyappr",stat:"appr3",dir:"up"  })},
    {text:txt.appr3+" : \xE2\xAC\x87", callback_data: JSON.stringify({action:"modifyappr",stat:"appr3",dir:"down"  })}
  ],
  [
    {text:txt.appr4+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifyappr",stat:"appr4",dir:"up"  })},
    {text:txt.appr4+" : \xE2\xAC\x87:", callback_data: JSON.stringify({action:"modifyappr",stat:"appr4",dir:"down"  })}
  ],
  [
    {text:txt.appr5+" : \xE2\xAC\x86", callback_data: JSON.stringify({action:"modifyappr",stat:"appr5",dir:"up"  })},
    {text:txt.appr5+" : \xE2\xAC\x87:", callback_data: JSON.stringify({action:"modifyappr",stat:"appr5",dir:"down"  })}
  ],
  [
    {text:txt.conferma, callback_data: JSON.stringify({action:"createusr", confirm:true })},
  ]
];

var semaphore=require('semaphore');

var sems=[];


function modifystat(query,data,next){
  var reply = bot.reply(query.message.chat);
  if(!(query.from.id in sems)){
    sems[query.from.id]=semaphore(1);
  }
  sems[query.from.id].take(function(){
    db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(user){
      if(!user){
        sems[query.from.id].leave();
        return next();
      }
      if(user.phase==2){
        var tot=15;
        var totdisp=tot-(user.forz+user.dex+user.inte+user.cari);
        var x={};
        x[data.stat]=user[data.stat];
        if(data.dir=="up"&&totdisp>0&&x[data.stat]<5){
          x[data.stat]=x[data.stat]+1;
          db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
            db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
              totdisp=tot-(userm.forz+userm.dex+userm.inte+userm.cari);
              reply.inlineKeyboard(statupdown).editHTML(query.message,txt.createpgcase2+totdisp+txt.forz+userm.forz+txt.dex+userm.dex+txt.inte+userm.inte+txt.cari+userm.cari).then(function(){setTimeout(sems[query.from.id].leave,1500)});
            });
          });
        }
        else if(data.dir=="down"&&x[data.stat]>0){
          x[data.stat]=x[data.stat]-1;
          db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
            db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
              totdisp=tot-(userm.forz+userm.dex+userm.inte+userm.cari);
              reply.inlineKeyboard(statupdown).editHTML(query.message,txt.createpgcase2+totdisp+txt.forz+userm.forz+txt.dex+userm.dex+txt.inte+userm.inte+txt.cari+userm.cari).then(function(){setTimeout(sems[query.from.id].leave,1500)});
            });
          });
        }
        else sems[query.from.id].leave();
      }
      else{
        support.deletecmd(reply,query.message);
        sems[query.from.id].leave();
      }
    });
  });
}


function modifyappr(query,data,next){
  var reply = bot.reply(query.message.chat);
  if(!(query.from.id in sems)){
    sems[query.from.id]=semaphore(1);
  }
  sems[query.from.id].take(function(){
    db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(user){
      if(!user){
        sems[query.from.id].leave();
        return next();
      }
      if(user.phase==3){
        var tot=8;
        var totdisp=tot-(user.appr1+user.appr2+user.appr3+user.appr4+user.appr5);
        var x={};
        x[data.stat]=user[data.stat];
        if(data.dir=="up"&&totdisp>0&&x[data.stat]<3){
          x[data.stat]=x[data.stat]+1;
          db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
            db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
              totdisp=tot-(userm.appr1+userm.appr2+userm.appr3+userm.appr4+userm.appr5);
              reply.inlineKeyboard(apprupdown).editHTML(query.message,txt.createpgcase3+totdisp+txt.appr1+userm.appr1+txt.appr2+userm.appr2+txt.appr3+userm.appr3+txt.appr4+userm.appr4+txt.appr5+userm.appr5).then(function(){setTimeout(sems[query.from.id].leave,1500)});
            });
          });
        }
        else if(data.dir=="down"&&x[data.stat]>0){
          x[data.stat]=x[data.stat]-1;
          db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
            db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
              totdisp=tot-(userm.appr1+userm.appr2+userm.appr3+userm.appr4+userm.appr5);
              reply.inlineKeyboard(apprupdown).editHTML(query.message,txt.createpgcase3+totdisp+txt.appr1+userm.appr1+txt.appr2+userm.appr2+txt.appr3+userm.appr3+txt.appr4+userm.appr4+txt.appr5+userm.appr5).then(function(){setTimeout(sems[query.from.id].leave,1500)});
            });
          });
        }
        else sems[query.from.id].leave();
      }
      else{
        support.deletecmd(reply,query.message);
        sems[query.from.id].leave();
      }
    });
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
            forz:0,dex:0,inte:0,cari:0,appr1:0,appr2:0,appr3:0,appr4:0,appr5:0,
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
        var tot=15;
        var totdisp=tot-(user.forz+user.dex+user.inte+user.cari);
        if(data.confirm&&totdisp==0){
          db.modifyobj("Users",{
              phase:3
            },
            { id: query.from.id , ready:false}
          );
          support.deletecmd(query.message.id,reply);
          reply.inlineKeyboard(apprupdown).html(txt.createpgcase3+txt.appr1+"0"+txt.appr2+"0"+txt.appr3+"0"+txt.appr4+"0"+txt.appr5+"0");
        }
        else query.answer({ text:txt.insall, alert: true });
        break;
      case 3:
        var tot=8;
        var totdisp=tot-(user.appr1+user.appr2+user.appr3+user.appr4+user.appr5);
        if(data.confirm&&totdisp==0){
          db.modifyobj("Users",{
              phase:4,
              ready:true
            },
            { id: query.from.id , ready:false}
          );
          reply.html(txt.regcompl);
          support.deletecmd(query.message.id,reply);
        }
        else query.answer({ text:txt.insall, alert: true });
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
        var tot=15;
        var totdisp=tot-(user.forz+user.dex+user.inte+user.cari);
        replyto.inlineKeyboard(statupdown).html(query.message,txt.createpgcase2+totdisp+txt.forz+user.forz+txt.dex+user.dex+txt.inte+user.inte+txt.cari+user.cari);
        break;
      case 3:
        var tot=8;
        var totdisp=tot-(user.appr1+user.appr2+user.appr3+user.appr4+user.appr5);
        replyto.inlineKeyboard(apprupdown).html(txt.createpgcase3+totdisp+txt.appr1+user.appr1+txt.appr2+user.appr2+txt.appr3+user.appr3+txt.appr4+user.appr4+txt.appr5+user.appr5);
        break;
      default:
        break;
    }
  });
}

module.exports={
  modifystat,
  createusrquery,
  createusr,
  modifyappr
}
