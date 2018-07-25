//require('dotenv').config();
var express = require('express');
var app = express();
const db = require("./databaseapi/mongoapi");
const txt = require("./text/textexport_ita");
const pause = require("./botapi/pausefunc");
const support= require("./botapi/supportfunc");
const turn= require("./botapi/turnapi");
const pauseable = require('pauseable');
const Botgram = require('botgram');
const moment = require('moment');
const MomentRange = require('moment-range');
const Moment = MomentRange.extendMoment(Moment);
const { TELEGRAM_BOT_TOKEN } = process.env;
global.bot = new Botgram(TELEGRAM_BOT_TOKEN);
global.timers=[];
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




function whomustplay(msg,reply){
  db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
    if(session.started===true){
      db.readfilefromdb("Users", {id:session.actualturn,sessionid:msg.chat.id}).then(function(users){
        support.replytousr(msg.from.id,msg,reply,txt.turnof+users.name).then(support.deletecmd(msg,reply));
      });
    }else{
      reply.text(txt. sessionnotstarted).then(support.deletecmd(msg,reply));
      console.log('session not started');
    }
  });
}9



function help(msg,reply){
 reply.text();
}



function start(msg,reply){
 reply.text("Ciao "+msg.from.firstname+txt.start);
}



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
        .then(function(){
          reply.text(txt.botstart);})
        .then(support.deletecmd(msg,reply))
        .then(function(){
          return db.readfilefromdb("Sessions", {id:msg.chat.id});})
        .then(function(result){reply.text(txt.nameis+result.name+"/SessionName");});
      }else{
        reply.text(txt.justcreate)
        .then(support.deletecmd(msg,reply));
      }
    });
  }
}



function newusr(msg,reply){
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool){
      if(msg.args(1)[0]=="pg"||msg.args(1)[0]=="master"){  //CASO 2 è STATO PASSATO UN PARAMETRO CORRETTO
        db.existindb("Users",{id:msg.from.id,sessionid:msg.chat.id}).then(function(exist){ //CASO 3 ESISTE GIA QUESTO GIOCATORE NELLA SESSIONE?
          if(!exist){
            if(msg.args(1)[0]=="master"){
              db.countindb("Users",{sessionid:msg.chat.id,role:"master"}).then(function(master){ //CASO 4 SE IMMESSO MASTER, ESISTE GIA UN MASTER DELLA SESSIONE?
                if(master==0){
                  //INSERT MASTER
                  db.createobj(
                    "Users",
                    {
                      id:msg.from.id,
                      sessionid:msg.chat.id,
                      name:msg.from.name,
                      role:"master",
                      gamedata:{},
                      active:true
                    },
                    {
                      id:msg.from.id,
                      sessionid:msg.chat.id
                    }
                  )
                  .then(reply.text(msg.from.name+txt.orae+msg.args(1)[0]))
                  .then(support.deletecmd(msg,reply));
                }else{
                  reply.text(txt.masterexist)
                  .then(support.deletecmd(msg,reply)); //CASO 4 RESPONSE
                }
              });
            }else{
              //INSERT PLAYER
              db.createobj(
                "Users",
                {
                  id:msg.from.id,
                  sessionid:msg.chat.id,
                  name:msg.from.name,
                  role:"pg",
                  gamedata:{},
                  active:true
                },
                {
                  id:msg.from.id,
                  sessionid:msg.chat.id,
                }
              )
              .then(reply.text(msg.from.name+txt.orae+msg.args(1)[0]))
              .then(support.deletecmd(msg,reply));
            }
          }else{
            reply.text(msg.from.name+txt.alreadyexist)
            .then(support.deletecmd(msg,reply)); //CASO 3 RESPONSE
          }
        });
      }else{
        reply.text(txt.afternewusr)
        .then(support.deletecmd(msg,reply)); //CASO 2 RESPONSE
      }
    }else{
      reply.text(txt.sessionnotcreated)
      .then(support.deletecmd(msg,reply)); //CASO 1 RESPONSE
    }
  });
}



function startsession(msg,reply){
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool){
      db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
        if(session.started==false){ //CASO 2 è STATA AVVIATA LA SESSIONE?
          db.countindb("Users",{sessionid:msg.chat.id,role:"master"}).then(function(masters){
            if(masters==1){// CASO 3 ESISTE IL MASTER?

              //AVVIA SESSIONE
              db.readfilefromdb("Users",{sessionid:msg.chat.id,role:"master"}).then(function(master){
                db.modifyobj("Sessions",{actualturn:master.id,started:true},{id:msg.chat.id});
                timers[msg.chat.id]="1";
                reply.text(txt.masterturn)
                .then(support.deletecmd(msg,reply));
              });

            }else{// CASO 3 RESPONSE
                reply.text(txt.insertmaster)
                .then(support.deletecmd(msg,reply));
            }
          });
        }else{ //CASO 2 RESPONSE
          if(session.started==undefined){
                reply.text(txt.sessionnotcreated)
                .then(support.deletecmd(msg,reply));
              }else{
          reply.text(txt.juststarted)
          .then(support.deletecmd(msg,reply));
              }
        }
      });
    }else{  //CASO 1 RESPONSE
      reply.text(txt.sessionnotcreated)
      .then(support.deletecmd(msg,reply));
    }
  });
}



function newmessage(msg,reply){

  db.readfilefromdb("Sessions",{id : msg.chat.id}).then(function(session){
    if(session){// CASO 1 ESISTE LA SESSIONE?
      if(session.started==true){
        if(session.actualturn==msg.from.id){
      if(timers[msg.chat.id] == null||timers[msg.chat.id]=="1"||timers[msg.chat.id].isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?
          var timetoset=moment().toObject();
          db.createobj(
            "Messages",
            {
              usr : msg.from.id, sessionid : msg.chat.id , time: timetoset , message : msg.args(1)[0]
            },
            {
              usr : msg.from.id, sessionid : msg.chat.id , time : timetoset
            },
          );
          turn.callturn(msg , reply, msg.from.id);

        }
        else{  // CASO 2 RESPONSE
          reply.text(txt.pauseon).then(support.deletecmd(msg,reply));
        }

        }else{
          reply.text(txt.isnotturn).then(support.deletecmd(msg,reply));
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



function deleteusr(msg,reply,nome){
  db.deletefromdb("Users",{sessionid:msg.chat.id,id:msg.from.id});
}



function reboot(msg,reply){
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






bot.command("startbot", startbot);
bot.command("startsession", startsession);
bot.command("newusr", newusr);
bot.command("msg", newmessage);
bot.command("turno", whomustplay);
bot.command("start", start);
bot.command("help", help);
bot.command("pauseon", pause.pauseon);
bot.command("pauseoff", pause.pauseoff);
bot.command("reboot", reboot);
bot.command("deleteusr", deleteusr);
