//require('dotenv').config();
var express = require('express');
var app = express();
const db = require("./databaseapi/mongoapi");
const txt = require("./text/textexport_ita");
const pause = require("./botapi/pausefunc");
const support= require("./botapi/supportfunc");
const turn= require("./botapi/turnapi");
const Botgram = require('botgram');
const moment = require('moment');
const MomentRange = require('moment-range');
const Moment = MomentRange.extendMoment(moment);
const { TELEGRAM_BOT_TOKEN } = process.env;
global.bot = new Botgram(TELEGRAM_BOT_TOKEN);
global.timers=[];
turn.inittimers();
moment().format();


var keyboardmenu=[
  [{text:"Nuovo giocatore", callback_data: JSON.stringify({ action: "newusr", role: "pg" })},{text:"Scheda Pg", callback_data: JSON.stringify({ action: "sheet"})}],
  [{text:"Pausa", callback_data: JSON.stringify({ action: "pauseon"})},{text:"Turno", callback_data: JSON.stringify({ action: "turn"})}],
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
  console.log(`Your app is listening on port ${listener.address().port}`)
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
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
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
            started: false
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
              },5000)}
            );
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
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
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
                      gamedata:{

                      },
                      ready:true,
                      phase:0
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
              db.createobj(
                "Users",
                {
                  id:query.from.id,
                  sessionid:msg.chat.id,
                  name:query.from.name,
                  role:"pg",
                  gamedata:{},
                  ready:false,
                  phase:0
                },
                {
                  id:query.from.id,
                  sessionid:msg.chat.id,
                }
              )
              .then(function(){
                reply.text(query.from.name+txt.orae+role);
                support.replytousr(query.from.id,txt.createpgcase0);
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


function whomustplay(query){
  var reply = bot.reply(query.message.chat);
  var msg=query.message;
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
 }else{
   db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
     if(session.started===true){
       db.readfilefromdb("Users", {id:session.actualturn,sessionid:msg.chat.id}).then(function(users){
        query.answer({ text:txt.turnof+users.name, alert: true });
       });
     }else{
       query.answer({ text:txt. sessionnotstarted, alert: true });
       //console.log('session not started');
     }
   });
 }
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





function createusrquery(query,data,next){
  if(query.message.chat.id!="user"){
   next();
  }
  var reply = bot.reply(query.message.chat);
  db.readfilefromdb("Users", {sessionid:query.message.chat.id}).then(function(user){
    if(!user){
      return next();
    }
    if(user.ready){
      return next();
    }
    switch (user.phase) {
      case 0:
        if(data.ys){
          db.modifyobj("Users",{
            gamedata:{
              charactername: query.message.text.replace(txt.addthisname,""),
            },
            phase:1
          },{ id: query.from.id , sessionid: data.sid});
          reply.text(txt.createpgcase1);
        }else{
          reply.text(txt.createpgcase0);
        }
        deletecmd(query.message,reply);
        break;
      case 1:
        if(data.ys){
          db.modifyobj("Users",{
            gamedata:{
              characterdescription: query.message.text.replace(txt.addthisdescription,""),
            },
            phase:2
          },{ id: query.from.id , sessionid: data.sid});
          reply.text(txt.createpgcase2);
        }else{
          reply.text(txt.createpgcase1);
        }
        deletecmd(query.message,reply);
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
   next();
  }
  db.readfilefromdb("Users", {id:msg.from.id,ready:false}).then(function(user){
    if(!user){
      return next();
    }
    var replyto = bot.reply(msg.from.id);
    switch (user.phase) {
      case 0:
      replyto.inlineKeyboard([
        [{text:txt.yes, callback_data: JSON.stringify({ sid:msg.chat.id, ys: true })},{text:txt.no, callback_data: JSON.stringify({sid:msg.chat.id, ys: false })}]
      ]).html(txt.addthisname+msg.text);
        break;
      case 1:
        replyto.inlineKeyboard([
          [{text:txt.yes, callback_data: JSON.stringify({ sid:msg.chat.id, ys: true })},{text:txt.no, callback_data: JSON.stringify({sid:msg.chat.id, ys: false })}]
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


function newmessage(msg,reply,next){
  if(msg.chat.type!="supergroup"){
   //reply.text(txt.bootnogroup);
   next();
  }
  else{
    db.readfilefromdb("Sessions",{id : msg.chat.id}).then(function(session){
      if(session){// CASO 1 ESISTE LA SESSIONE?
        if(session.started==true){
          if(timers[msg.chat.id] == null||timers[msg.chat.id]=="1"||timers[msg.chat.id].timer.isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?
            if(session.actualturn==msg.from.id){


              var replytousr = bot.reply(msg.from.id);
              replytousr.inlineKeyboard([
                [
                  {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: msg.chat.id})},
                  {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
                ]
              ]);

              var txttosend= "<strong>"+txt.wanttosend+"</strong>"+"\n \n"+msg.text;

              replytousr.html(txttosend).then(support.deletecmd(msg,reply));

            }
            else{  // CASO 2 RESPONSE
              support.replytousr(msg.from.id,txt.isnotturn).then(support.deletecmd(msg,reply));
            }

          }else{
            support.replytousr(msg.from.id,txt.pauseon).then(support.deletecmd(msg,reply));
          }
        }else{
          reply.text(txt.sessionnotstarted).then(support.deletecmd(msg,reply));
        }
      }
      else{ // CASO 1 RESPONSE
        reply.text(txt.sessionnotcreated).then(support.deletecmd(msg,reply));
      }
    });
  }
}

function deletesentmessage(query){
  var reply = bot.reply(query.message.chat);
  support.deletecmd(query.message.id,reply);
}

function  sendmessage(query,chatid){
  var reply = bot.reply(query.message.chat);
  var replytochat = bot.reply(chatid);

  db.readfilefromdb("Sessions",{id : chatid}).then(function(session){
    if(session){// CASO 1 ESISTE LA SESSIONE?
      if(session.started==true){
        if(timers[chatid] == null||timers[chatid]=="1"||timers[chatid].timer.isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?
          if(session.actualturn==query.from.id){
            var txttosend=query.message.text.replace(txt.wanttosend,"<strong>"+query.from.name+":"+"</strong>");
            support.deletecmd(query.message.id,reply);
            replytochat.html(txttosend);
            var timetoset=Date.now();
            db.createobj(
              "Messages",
              {
                usr : query.from.id, sessionid : chatid , time: timetoset , message : query.message.text
              },
              {
                usr : query.from.id, sessionid : chatid , time : timetoset
              },
            );
            turn.callturn(chatid , query.from.id);
          }
          else{  // CASO 2 RESPONSE
            support.replytousr(query.from.id,txt.isnotturn);
          }

        }else{
          support.replytousr(query.from.id,txt.pauseon);
        }
      }else{
        support.replytousr(query.from.id.sessionnotstarted);
      }
    }
    else{ // CASO 1 RESPONSE
      support.replytousr(query.from.id.sessionnotcreated);
    }
  });
}


function deleteusr(msg,reply,nome){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
 }else{
  db.deletefromdb("Users",{sessionid:msg.chat.id,id:msg.from.id});
 }
}



function reboot(msg,reply){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
 }else{
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool&&msg.args(1)[0]=="password"){ //CASO 1 ESISTE LA SESSIONE e la password è corretta?
      db.modifyobj(
        "Sessions",
        {
          id:msg.chat.id,
          sessionname:msg.chat.title,
          users:[],
          totalturn:1,
          actualturn:0,
          message: [],
          started: false
        },
        {
          id:msg.chat.id
        }
      ).then(reply.text("Sessione riavviata Master è il tuo turno. DEBUG"))
      .then(support.deletecmd(msg,reply));
    }else{
      support.deletecmd(msg,reply);
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
  if (data.action == "STARTSESSION") startsession(query,data.hours);;
  if (data.action == "newusr") newusr(query,data.role);
  if (data.action == "turn") whomustplay(query);
  if (data.action == "pauseon") pause.switchpauseon(query);
  if (data.action == "pauseoff") pause.switchpauseoff(query);
  if (data.action == "sendmessage") sendmessage(query,data.chatid);
  if (data.action == "deletemessage") deletesentmessage(query);
  createusrquery(query,data,next);
  return next();
});



bot.command("start", start);
bot.command("startbot", startbot);
bot.command("menu", openmenu);
bot.command("help", help);
bot.command("reboot", reboot);
bot.command("deleteusr", deleteusr);
bot.command("pauseoff", pause.reinitpausemsg);
bot.text(newmessage);
bot.text(createusr);
//bot.all(function (msg, reply) {support.deletecmd(msg,reply);});
