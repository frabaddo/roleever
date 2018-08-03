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
        reply.keyboard().text(txt.justcreate)
        .then(function(err,result){
          support.deletecmd(msg,reply);
          setTimeout(function(){
            support.deletecmd(result,reply);
          },5000)}
        );
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


function startsession(query){
  var reply = bot.reply(query.message.chat);
  var msg=query.message;
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool){
      db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
        if(session.started==false){ //CASO 2 è STATA AVVIATA LA SESSIONE?

          db.readfilefromdb("Users",{sessionid:msg.chat.id,role:"master"}).then(function(master){
            console.log("master found in this session: "+master);
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
        }
      });
    }else{  //CASO 1 RESPONSE
      query.answer({ text: txt.sessionnotcreated, alert: true });
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
       console.log('session not started');
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
                  {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: msg.chat.id, msgtxt: msg.text })},
                  {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
                ]
              ]);

              replytousr.text(msg.text);
              support.deletecmd(msg,reply);
              /*
              var timetoset=Date.now();
              db.createobj(
                "Messages",
                {
                  usr : msg.from.id, sessionid : msg.chat.id , time: timetoset , message : msg.text
                },
                {
                  usr : msg.from.id, sessionid : msg.chat.id , time : timetoset
                },
              );
              turn.callturn(msg.chat.id , msg.from.id);*/
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

function deletesentmessage(query){
  var reply = bot.reply(query.message.chat);
  suppord.deletecmd(query.message.id,reply);
}

function  sendmessage(query,chatid,txt){
  var reply = bot.reply(query.message.chat);
  suppord.deletecmd(query.message.id,reply);
  var replytochat = bot.reply(chatid);
  replytochat.text(txt);
  var timetoset=Date.now();
  db.createobj(
    "Messages",
    {
      usr : query.from.id, sessionid : chatid , time: timetoset , message : txt
    },
    {
      usr : query.from.id, sessionid : chatid , time : timetoset
    },
  );
  turn.callturn(chatid , query.from.id);
}


bot.callback(function (query, next) {
  if (query.data!="STARTSESSION") {
    return next();
  }
  startsession(query);
});

bot.callback(function (query, next) {
  var data;
  try {
    data = JSON.parse(query.data);
  } catch (e) {
    return next();
  }
  if (data.action == "newusr") newusr(query,data.role);
  if (data.action == "turn") whomustplay(query);
  if (data.action == "pauseon") pause.switchpauseon(query);
  if (data.action == "pauseoff") pause.switchpauseoff(query);
  if (data.action == "sendmessage") sendmessage(query,data.chatid,data.msgtxt);
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
bot.all(function (msg, reply, next) {support.deletecmd(msg,reply);});
