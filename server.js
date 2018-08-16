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
            users:[],
            totalturn:1,
            actualturn:0,
            message: [],
            started: false
          },
          {
            id:msg.chat.id
          }
        )
        .then(support.deletecmd(msg,reply))
        .then(function(result){
          reply.inlineKeyboard([
            [{text:"Avvia la sessione", callback_data: "STARTSESSION"}],
            [{text:"Nuovo giocatore", callback_data: JSON.stringify({ action: "newusr", role: "pg" })},{text:"Nuovo master", callback_data: JSON.stringify({ action: "newusr", role: "master" })}]
          ]);
          reply.markdown("Il master potrà avviare la sessione quando lui e i giocatori si saranno registrati");
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
            reply.inlineKeyboard([
              [{text:"Avvia sessione con turni da 4h", callback_data: JSON.stringify({ action: "STARTSESSION", hours: 4 })}],
              [{text:"Avvia sessione con turni da 6h", callback_data: JSON.stringify({ action: "STARTSESSION", hours: 6 })}],
              [{text:"Nuovo giocatore", callback_data: JSON.stringify({ action: "newusr", role: "pg" })},{text:"Nuovo master", callback_data: JSON.stringify({ action: "newusr", role: "master" })}]
            ]);
            reply.markdown("Il master potrà avviare la sessione quando lui e i giocatori si saranno registrati");
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
                      gamedata:{},
                      active:true
                    },
                    {
                      id:query.from.id,
                      sessionid:msg.chat.id
                    }
                  )
                  .then(reply.text(query.from.name+txt.orae+role));
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
                  active:true
                },
                {
                  id:query.from.id,
                  sessionid:msg.chat.id,
                }
              )
              .then(reply.text(query.from.name+txt.orae+role));
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


function startsession(query,hours){
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
                db.modifyobj("Sessions",{actualturn:master.id,started:true},{id:msg.chat.id});
                timers[msg.chat.id]="1";
                reply.inlineKeyboard([
                  [{text:"Nuovo giocatore", callback_data: JSON.stringify({ action: "newusr", role: "pg" })},{text:"Scheda Pg", callback_data: JSON.stringify({ action: "sheet"})}],
                  [{text:"Pausa", callback_data: JSON.stringify({ action: "pauseon"})},{text:"Turno", callback_data: JSON.stringify({ action: "turn"})}],
                ]);
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


var openmenu = function(msg,reply){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
   support.deletecmd(msg,reply);
  }
  else{
    db.readfilefromdb("Sessions",{id : msg.chat.id}).then(function(session){
      if(session){// CASO 1 ESISTE LA SESSIONE?
        if(session.started==true){
          reply.inlineKeyboard([
            [{text:"Nuovo giocatore", callback_data: JSON.stringify({ action: "newusr", role: "pg" })},{text:"Scheda Pg", callback_data: JSON.stringify({ action: "sheet"})}],
            [{text:"Pausa", callback_data: JSON.stringify({ action: "pauseon"})},{text:"Turno", callback_data: JSON.stringify({ action: "turn"})}],
          ]);
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









function newmessage(msg,reply){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
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
});



bot.command("start", start);
bot.command("startbot", startbot);
bot.command("menu", openmenu);
bot.command("help", help);
bot.command("reboot", reboot);
bot.command("deleteusr", deleteusr);
bot.command("pauseoff", pause.reinitpausemsg);
bot.text(newmessage);
//bot.all(function (msg, reply) {support.deletecmd(msg,reply);});
