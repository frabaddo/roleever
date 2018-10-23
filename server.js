//require('dotenv').config();
var express = require('express');
var app = express();
const db = require("./databaseapi/mongoapi");
const txt = require("./text/textexport_ita");
const pause = require("./botapi/pausefunc");
const support= require("./botapi/supportfunc");
const turn= require("./botapi/turnapi");
const createpg= require("./botapi/createpg");
const msgapi= require("./botapi/messageapi");
const gamefunc= require("./botapi/gamefunction");
const Botgram = require('botgram');
const Long = require('mongodb').Long;
const moment = require('moment');
const MomentRange = require('moment-range');
const Moment = MomentRange.extendMoment(moment);
const { TELEGRAM_BOT_TOKEN2 } = process.env;
global.bot = new Botgram(TELEGRAM_BOT_TOKEN2);
global.timers=[];
turn.inittimers();
moment().format();


var keyboardmenu=[
  [{text:"Nuovo giocatore", callback_data: JSON.stringify({ action: "newusr", role: "pg" })},{text:"Scheda Pg", callback_data: JSON.stringify({ action: "sheet"})}],
  [{text:"Pausa", callback_data: JSON.stringify({ action: "pauseon"})},{text:"Turno", callback_data: JSON.stringify({ action: "turn"})}],
  [{text:"Passa Turno", callback_data: JSON.stringify({ action: "skipturn"})}],
];

var keyboardstart= [
  [{text:"Avvia: 2h", callback_data: JSON.stringify({ action: "STARTSESSION", hours: 7200000 })},{text:"Avvia: 4h", callback_data: JSON.stringify({ action: "STARTSESSION", hours: 14400000 })}],
  [{text:"Avvia: 6h(Consigliato)", callback_data: JSON.stringify({ action: "STARTSESSION", hours: 21600000 })},{text:"Avvia: 8h", callback_data: JSON.stringify({ action: "STARTSESSION", hours: 28800000 })}],
  [{text:"Nuovo giocatore", callback_data: JSON.stringify({ action: "newusr", role: "pg" })},{text:"Nuovo master", callback_data: JSON.stringify({ action: "newusr", role: "master" })}]
];




app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Seems like you forgot to pass Telegram Bot Token. I can not proceed...');
  process.exit(1);
}


app.get('/reboottimer', function(req, res) {
  res.send('done');
});


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});
/*
function calctime( time ){
  var range1 = Moment.range(Moment(), Moment().add(6, 'h'));
  var range2 = Moment.range(Moment(), Moment());
  range1.overlaps(range2);
}

*/

function startbot(msg,reply){
  if(msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
  }
  else{
    db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?

      if(!bool){
        db.createobj(
          "Sessions",
          {
            id:msg.chat.id,
            sessionname:msg.chat.title,
            hours:0,
            totalturn:1,
            actualturn:0,
            started: false,
            playersdamage:{},
            messagedamage:0
          },
          {
            id:msg.chat.id
          }
        )
        .then(support.deletecmd(msg,reply))
        .then(function(result){
          reply.inlineKeyboard(keyboardstart);
          reply.markdown(txt.startregister);
        });
      }else{
        db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
          if(session.started==true){
            reply.keyboard().text(txt.justcreate)
            .then(function(err,result){
              support.deletecmd(msg,reply);
              setTimeout(function(){
                support.deletecmd(result,reply);
              },5000);
            });
          }else{
            support.deletecmd(msg,reply);
            reply.inlineKeyboard(keyboardstart);
            reply.markdown(txt.startregister);
          }
        });
      }
    });
  }
}


function newusr(query,role){
  var reply = bot.reply(query.message.chat);
  var msg=query.message;
  db.readfilefromdb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool){
      if(role=="pg"||role=="master"){  //CASO 2 è STATO PASSATO UN PARAMETRO CORRETTO
        db.existindb("Users",{id:query.from.id,sessionid:msg.chat.id}).then(function(exist){ //CASO 3 ESISTE GIA QUESTO GIOCATORE NELLA SESSIONE?
          if(!exist){
            if(role=="master"){
              db.countindb("Users",{sessionid:msg.chat.id,role:"master"}).then(function(master){ //CASO 4 SE IMMESSO MASTER, ESISTE GIA UN MASTER DELLA SESSIONE?
                if(master==0){
                  //INSERT MASTER
                  db.createobj(
                    "Users",
                    {
                      id:query.from.id,
                      sessionid:msg.chat.id,
                      name:query.from.name,
                      role:"master",
                      ready:true,
                      join:true,
                      phase:4
                    },
                    {
                      id:query.from.id,
                      sessionid:msg.chat.id
                    }
                  )
                  .then(function(){
                    reply.text(query.from.name+txt.orae+role);
                  });
                }else{
                  query.answer({ text: txt.masterexist, alert: true });
                }
              });
            }else{
              //INSERT PLAYER
              db.countindb("Users",{id:query.from.id,ready:false}).then(function(countunready){
                if(countunready==0){
                  db.createobj(
                    "Users",
                    {
                      id:query.from.id,
                      sessionid:msg.chat.id,
                      name:query.from.name,
                      role:"pg",
                      ready:false,
                      join:true,
                      phase:0
                    },
                    {
                      id:query.from.id,
                      sessionid:msg.chat.id,
                    }
                  )
                  .then(function(){
                    var damage = bool.playersdamage;
                    damage[query.from.id]=0;
                    db.modifyobj(
                      "Sessions",
                      {
                        playersdamage: damage
                      },
                      {id:msg.chat.id}
                    ).then(function(){
                      reply.text(query.from.name+txt.orae+role+txt.creationphase);
                      support.replytousr(query.from.id,txt.createpgcase0);
                    });
                  });
                }else{
                  query.answer({ text: txt.alreadycreating, alert: true });
                }
              });
            }
          }else{
            query.answer({ text: query.from.name+txt.alreadyexist, alert: true });
          }
        });
      }else{
        return false;
      }
    }else{
      return false;
    }
  });
}

function startsession(query,turntime){
  var reply = bot.reply(query.message.chat);
  var msg=query.message;
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool){
      db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
        if(session.started==false){ //CASO 2 è STATA AVVIATA LA SESSIONE?

          db.readfilefromdb("Users",{sessionid:msg.chat.id,role:"master"}).then(function(master){
            //console.log("master found in this session: "+master);
            if(master&&master.id==query.from.id){// CASO 3 ESISTE IL MASTER?
              //AVVIA SESSIONE
                db.modifyobj("Sessions",{actualturn:master.id,hours:turntime,started:true},{id:msg.chat.id});
                timers[msg.chat.id]="1";
                reply.inlineKeyboard(keyboardmenu);
                reply.markdown("MENU SESSIONE").then((err, result) => {
                  bot.pinChatMessage(msg.chat.id,result,{disableNotification:false},function(){});
                });
                support.deletecmd(msg,reply);
                reply.text(txt.masterturn);

            }else{// CASO 3 RESPONSE
              query.answer({ text: txt.onlymaster, alert: true });
            }
          });

        }else{ //CASO 2 RESPONSE
          query.answer({ text: txt.juststarted, alert: true });
          support.deletecmd(msg,reply);
        }
      });
    }else{  //CASO 1 RESPONSE
      query.answer({ text: txt.sessionnotcreated, alert: true });
      support.deletecmd(msg,reply);
    }
  });
}


function openmenu(msg,reply){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
   support.deletecmd(msg,reply);
  }
  else{
    db.readfilefromdb("Sessions",{id : msg.chat.id}).then(function(session){
      if(session){// CASO 1 ESISTE LA SESSIONE?
        if(session.started==true){
          reply.inlineKeyboard(keyboardmenu);
          reply.markdown("MENU SESSIONE").then((err, result) => {
            bot.pinChatMessage(msg.chat.id,result,{disableNotification:false},function(){});
          });
        }
      }
    });
    support.deletecmd(msg,reply);
  }
}


function help(msg,reply){
 reply.text();
}


function start(msg,reply){
 reply.text("Ciao "+msg.from.firstname+txt.start);
}


function deleteusr(msg,reply){
  if(msg.chat.type!="user"){
    db.readfilefromdb("Users",{sessionid:msg.chat.id,id:msg.member.id}).then(function(user){
      if(user){
        db.modifyobj("Users",{join:false},{sessionid:msg.chat.id,id:msg.member.id}).then(function(){
          db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
            if(session){
              if(session.started===true){
                db.readfilefromdb("Users", {id:session.actualturn,sessionid:msg.chat.id}).then(function(turnuser){
                  if(turnuser.id==user.id){
                    turn.callturn(msg.chat.id,turnuser.id);
                  }
                });
              }
            }
          });
          support.replytousr(msg.member.id,txt.byebye);
        });
      }
    });
  }
}

function reenterusr(msg,reply){
  if(msg.chat.type!="user"){
    msg.members.forEach(function(member){
      db.readfilefromdb("Users",{sessionid:msg.chat.id,id:member.id}).then(function(user){
        if(user){
          db.modifyobj("Users",{join:true},{sessionid:msg.chat.id,id:member.id});
          support.replytousr(member.id,txt.welcomeback);
        }
      });
    });
  }
}

function migratechat(msg,reply){
  db.readfilefromdb("Sessions",{id:msg.chat.id}).then(function(session){
    if(session){
      //db.modifyobj("Sessions",{id:msg.toId},{id:msg.chat.id});
      db.readfilefromdb("Users",{sessionid:msg.chat.id}).then(function(users){
        users.forEach(function(user){
          //db.modifyobj("Users",{sessionid:msg.toId},{sessionid:msg.chat.id,id:user.id});
        });
      });
    }
  });
}

function deleteoffturnmsg(msg,reply){
  if(msg.chat.type!="user"){
    db.readfilefromdb("Users",{sessionid:msg.chat.id,id:msg.from.id}).then(function(user){
      if(!user||user.role!="master")support.deletecmd(msg,reply);
    });
  }
}

function changesessionname(msg,reply){
  db.readfilefromdb("Sessions",{id:msg.chat.id}).then(function(session){
    if(session){
      db.modifyobj("Sessions",{sessionname:msg.title},{id:msg.chat.id});
    }
  });
}

function msgusr(msg,reply){
  console.log("cose");
  var arg=msg.args(2);
  console.log(arg[0]);
  console.log(arg[1]);
  var txttosend=arg[1];

  support.replytousr(parseInt(arg[0], 10),txttosend);
}

function changeduration(msg,reply){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
    reply.text(txt.bootnogroup);
  }else{
   db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
     if(session){
       if(session.started===true){
         var arg=msg.args(1)[0];
         if(arg){
           var time=parseFloat(arg);
           if(!isNaN(time)&&time>0&&time<25){
             var newtime=time*3600000;
             console.log(newtime);
             db.modifyobj("Sessions",{hours:newtime},{id:msg.chat.id});
             var timechanged=moment.duration(newtime);
             var y = timechanged.hours() + ":" + timechanged.minutes();
             reply.text(txt.newtime+y);
           }
         }
       }
     }
   });
  }
}


bot.callback(function (query, next) {
  var data;
  try {
    data = JSON.parse(query.data);
  } catch (e) {
    return next();
  }
  if (data.action == "STARTSESSION") startsession(query,data.hours);
  if (data.action == "newusr") newusr(query,data.role);
  if (data.action == "sheet") createpg.retrievesheet(query);
  if (data.action == "turn") turn.whomustplay(query);
  if (data.action == "skipturn") turn.skipturn(query);
  if (data.action == "pauseon") pause.switchpauseon(query);
  if (data.action == "pauseoff") pause.switchpauseoff(query);
  if (data.action == "sendmessage") msgapi.sendmessage(query,data.chatid);
  if (data.action == "deletemessage") msgapi.deletesentmessage(query);
  if (data.action == "createusr") createpg.createusrquery(query,data,next);
  if (data.action == "modifystat") createpg.modifystat(query,data,next);
  if (data.action == "modifyappr") createpg.modifyappr(query,data,next);
  if (data.action == "addroll") gamefunc.addroll(query,data);
  if (data.action == "addappr") gamefunc.addappr(query,data);
  if (data.action == "confirm") gamefunc.confirmfunc(query,data);
  if (data.action == "back") gamefunc.backfunc(query,data);
  if (data.action == "makedamage") gamefunc.makedamage(query,data);
  if (data.action == "healdamage") gamefunc.healdamage(query,data);
  return next();
});


bot.update("member", "leave", deleteusr);
bot.update("member", "new", reenterusr);
bot.update("title", "new", changesessionname);

bot.update("chat", "migrateTo", migratechat);

bot.command("changeduration", changeduration);
bot.command("msgusr", msgusr);
bot.command("start", start);
bot.command("startbot", startbot);
bot.command("menu", openmenu);
bot.command("pauseoff", pause.reinitpausemsg);
//bot.command("help", help);
bot.text(msgapi.newmessage);
bot.text(createpg.createusr);

bot.all(deleteoffturnmsg);
//bot.all(function (msg, reply) {support.deletecmd(msg,reply);});
