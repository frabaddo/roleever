const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const txt = require("../text/textexport_ita");
const statupdown=[
  [
    {text:txt.forz+" : ↑", callback_data: JSON.stringify({action:"modifystat",stat:"forz",dir:"up"  })},
    {text:txt.forz+" : ↓", callback_data: JSON.stringify({action:"modifystat",stat:"forz",dir:"down"  })}
  ],
  [
    {text:txt.dex+" : ↑", callback_data: JSON.stringify({action:"modifystat",stat:"dex",dir:"up"  })},
    {text:txt.dex+" : ↓", callback_data: JSON.stringify({action:"modifystat",stat:"dex",dir:"down"  })}
  ],
  [
    {text:txt.inte+" : ↑", callback_data: JSON.stringify({action:"modifystat",stat:"inte",dir:"up"  })},
    {text:txt.inte+" : ↓", callback_data: JSON.stringify({action:"modifystat",stat:"inte",dir:"down"  })}
  ],
  [
    {text:txt.cari+" : ↑", callback_data: JSON.stringify({action:"modifystat",stat:"cari",dir:"up"  })},
    {text:txt.cari+" : ↓:", callback_data: JSON.stringify({action:"modifystat",stat:"cari",dir:"down"  })}
  ],
  [
    {text:txt.conferma, callback_data: JSON.stringify({action:"createusr", confirm:true })},
  ]
];

const apprupdown=[
  [
    {text:txt.appr1+" : ↑", callback_data: JSON.stringify({action:"modifyappr",stat:"appr1",dir:"up"  })},
    {text:txt.appr1+" : ↓:", callback_data: JSON.stringify({action:"modifyappr",stat:"appr1",dir:"down"  })}
  ],
  [
    {text:txt.appr2+" : ↑", callback_data: JSON.stringify({action:"modifyappr",stat:"appr2",dir:"up"  })},
    {text:txt.appr2+" : ↓", callback_data: JSON.stringify({action:"modifyappr",stat:"appr2",dir:"down"  })}
  ],
  [
    {text:txt.appr3+" : ↑", callback_data: JSON.stringify({action:"modifyappr",stat:"appr3",dir:"up"  })},
    {text:txt.appr3+" : ↓", callback_data: JSON.stringify({action:"modifyappr",stat:"appr3",dir:"down"  })}
  ],
  [
    {text:txt.appr4+" : ↑", callback_data: JSON.stringify({action:"modifyappr",stat:"appr4",dir:"up"  })},
    {text:txt.appr4+" : ↓", callback_data: JSON.stringify({action:"modifyappr",stat:"appr4",dir:"down"  })}
  ],
  [
    {text:txt.appr5+" : ↑", callback_data: JSON.stringify({action:"modifyappr",stat:"appr5",dir:"up"  })},
    {text:txt.appr5+" : ↓", callback_data: JSON.stringify({action:"modifyappr",stat:"appr5",dir:"down"  })}
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
  if(sems[query.from.id].available()){
    sems[query.from.id].take(function(){
      db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(user){
        if(!user){
          sems[query.from.id].leave();
          return next();
        }
        if(user.phase==2){
          var tot=8;
          var totdisp=tot-(user.forz+user.dex+user.inte+user.cari);
          var x={};
          x[data.stat]=user[data.stat];
          if(data.dir=="up"&&totdisp>0&&x[data.stat]<5){
            x[data.stat]=x[data.stat]+1;
          }
          else if(data.dir=="down"&&x[data.stat]>0){
            x[data.stat]=x[data.stat]-1;
          }
          else sems[query.from.id].leave();
          db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
            db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
              totdisp=tot-(userm.forz+userm.dex+userm.inte+userm.cari);
              reply.inlineKeyboard(statupdown).editMarkdown(query.message,txt.createpgcase2+totdisp+"\n"+txt.forz+userm.forz+"\n"+txt.dex+userm.dex+"\n"+txt.inte+userm.inte+"\n"+txt.cari+userm.cari).then(function(){setTimeout(sems[query.from.id].leave,1500);});
            });
          });

        }
        else{
          support.deletecmd(reply,query.message);
          sems[query.from.id].leave();
        }
      });
    });
  }
}


function modifyappr(query,data,next){
  var reply = bot.reply(query.message.chat);
  if(!(query.from.id in sems)){
    sems[query.from.id]=semaphore(1);
  }
  if(sems[query.from.id].available()){
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
                reply.inlineKeyboard(apprupdown).editMarkdown(query.message,txt.createpgcase3+totdisp+"\n"+txt.appr1+userm.appr1+"\n"+txt.appr2+userm.appr2+"\n"+txt.appr3+userm.appr3+"\n"+txt.appr4+userm.appr4+"\n"+txt.appr5+userm.appr5).then(function(){setTimeout(sems[query.from.id].leave,1500);});
              });
            });
          }
          else if(data.dir=="down"&&x[data.stat]>0){
            x[data.stat]=x[data.stat]-1;
            db.modifyobj("Users",x,{ id: query.from.id , ready:false}).then(function(){
              db.readfilefromdb("Users", {id:query.from.id,ready:false}).then(function(userm){
                totdisp=tot-(userm.appr1+userm.appr2+userm.appr3+userm.appr4+userm.appr5);
                reply.inlineKeyboard(apprupdown).editMarkdown(query.message,txt.createpgcase3+totdisp+"\n"+txt.appr1+userm.appr1+"\n"+txt.appr2+userm.appr2+"\n"+txt.appr3+userm.appr3+"\n"+txt.appr4+userm.appr4+"\n"+txt.appr5+userm.appr5).then(function(){setTimeout(sems[query.from.id].leave,1500);});
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
    var tot;
    var totdisp;
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
            forz:0,dex:0,inte:0,cari:0,appr1:0,appr2:0,appr3:0,appr4:0,appr5:0,pf:3,
            phase:2
          },
          { id: query.from.id , sessionid: data.sid}
        );
          reply.inlineKeyboard(statupdown).markdown(txt.createpgcase2+"8"+"\n"+txt.forz+"0"+"\n"+txt.dex+"0"+"\n"+txt.inte+"0"+"\n"+txt.cari+"0");
        }else{
          reply.text(txt.createpgcase1);
        }
        support.deletecmd(query.message.id,reply);
        break;
      case 2:
        tot=8;
        totdisp=tot-(user.forz+user.dex+user.inte+user.cari);
        if(data.confirm&&totdisp==0){
          db.modifyobj("Users",{
              phase:3
            },
            { id: query.from.id , ready:false}
          );
          setTimeout(function(){
            support.deletecmd(query.message.id,reply);
            reply.inlineKeyboard(apprupdown).markdown(txt.createpgcase3+"\n"+txt.appr1+"0"+"\n"+txt.appr2+"0"+"\n"+txt.appr3+"0"+"\n"+txt.appr4+"0"+"\n"+txt.appr5+"0");
          },1000);
        }
        else query.answer({ text:txt.insall, alert: true });
        break;
      case 3:
        console.log("ready to display user info 1");
        tot=8;
        totdisp=tot-(user.appr1+user.appr2+user.appr3+user.appr4+user.appr5);
        if(data.confirm&&totdisp==0){
          db.modifyobj("Users",{
              phase:4,
              ready:true
            },
            { id: query.from.id , ready:false}
          );
          console.log("ready to display user info 2");
          if(user.join){
            bot.reply(user.sessionid).markdown(txt.newchar+user.charactername+"\n\n"+user.characterdescription).then(function(){
              setTimeout(function(){
                reply.markdown(txt.regcompl);
                support.deletecmd(query.message.id,reply);
              },1000);
            });
          }else{
            setTimeout(function(){
              reply.markdown(txt.regcompl);
              support.deletecmd(query.message.id,reply);
            },1000);
          }
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
    var tot;
    var totdisp;
    var replyto = bot.reply(msg.from.id);
    switch (user.phase) {
      case 0:
        replyto.inlineKeyboard([
          [{text:txt.yes, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: true })},{text:txt.no, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: false })}]
        ]).markdown(txt.addthisname+msg.text).then((err, result) => {
            if (err)
              console.error("Sending message failed!");
            else
              console.log("Sent message");
          });;
        break;
      case 1:
        replyto.inlineKeyboard([
          [{text:txt.yes, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: true })},{text:txt.no, callback_data: JSON.stringify({action:"createusr", sid:user.sessionid, ys: false })}]
        ]).markdown(txt.addthisdescription+msg.text);
        break;
      case 2:
        tot=8;
        totdisp=tot-(user.forz+user.dex+user.inte+user.cari);
        replyto.inlineKeyboard(statupdown).markdown(txt.createpgcase2+totdisp+"\n"+txt.forz+user.forz+"\n"+txt.dex+user.dex+"\n"+txt.inte+user.inte+"\n"+txt.cari+user.cari);
        break;
      case 3:
        tot=8;
        totdisp=tot-(user.appr1+user.appr2+user.appr3+user.appr4+user.appr5);
        replyto.inlineKeyboard(apprupdown).markdown(txt.createpgcase3+totdisp+"\n"+txt.appr1+user.appr1+"\n"+txt.appr2+user.appr2+"\n"+txt.appr3+user.appr3+"\n"+txt.appr4+user.appr4+"\n"+txt.appr5+user.appr5);
        break;
      default:
        break;
    }
  });
}

var retrievesheet=function(query){
  var reply=bot.reply(query.from.id);
  db.readfilefromdb("Users", {id:query.from.id,sessionid:query.message.chat.id,role:"pg",ready:true}).then(function(user){
    if(user){
      var sheettext="*"+txt.name+"*"+user.charactername+"\n\n*"+txt.description+"*"+user.characterdescription+"\n\n*"+txt.pf+"*"+user.pf+"\n\n";
      sheettext=sheettext+"-----------------";
      sheettext=sheettext+"*"+"\n"+txt.forz+":* "+user.forz+"\n"+"*"+"\n"+txt.dex+":* "+user.dex+"\n"+"*"+"\n"+txt.inte+":* "+user.inte+"\n"+"*"+"\n"+txt.cari+":* "+user.cari+"\n\n";
      sheettext=sheettext+"-----------------";
      sheettext=sheettext+"*"+"\n"+txt.appr1+":* "+user.appr1+"\n"+"*"+"\n"+txt.appr2+":* "+user.appr2+"\n"+"*"+"\n"+txt.appr3+":* "+user.appr3+"\n";
      sheettext=sheettext+"*"+"\n"+txt.appr4+":* "+user.appr4+"\n"+"*"+"\n"+txt.appr5+":* "+user.appr5+"\n\n";
      reply.markdown(sheettext);
    }
  });
};

var retrieveallsheet=function(query){
  var reply=bot.reply(query.from.id);
  db.readfilefromdb("Users", {sessionid:query.message.chat.id,ready:true},true).then(function(users){
    if(users){
      if(users.find(u => u.role=='master').id==query.from.id){
        query.answer({ text:"ti sto inviando le schede in privato. a breve arriveranno tutte!", alert: true });
        reply.markdown("Lista Giocatori:");
        users.forEach(function(user) {
          if(user.role=="pg"){
            setTimeout(function(){
              var sheettext="*"+txt.name+"*"+user.charactername+"\n\n*"+txt.description+"*"+user.characterdescription+"\n\n*"+txt.pf+"*"+user.pf+"\n\n";
              sheettext=sheettext+"-----------------";
              sheettext=sheettext+"*"+"\n"+txt.forz+":* "+user.forz+"\n"+"*"+"\n"+txt.dex+":* "+user.dex+"\n"+"*"+"\n"+txt.inte+":* "+user.inte+"\n"+"*"+"\n"+txt.cari+":* "+user.cari+"\n\n";
              sheettext=sheettext+"-----------------";
              sheettext=sheettext+"*"+"\n"+txt.appr1+":* "+user.appr1+"\n"+"*"+"\n"+txt.appr2+":* "+user.appr2+"\n"+"*"+"\n"+txt.appr3+":* "+user.appr3+"\n";
              sheettext=sheettext+"*"+"\n"+txt.appr4+":* "+user.appr4+"\n"+"*"+"\n"+txt.appr5+":* "+user.appr5;
              reply.markdown(sheettext);
            }, 1100);
          }
        });
      }
      else{
        query.answer({ text: "Solo il master può vedere le schede di tutti i giocatori", alert: true });
      }
    }
  });
};

module.exports={
  modifystat,
  createusrquery,
  createusr,
  modifyappr,
  retrievesheet,
  retrieveallsheet
};
