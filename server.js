//require('dotenv').config();
var express = require('express');
var app = express();
const db = require("./databaseapi");
const txt = require("./textexport");
const pauseable = require('pauseable');
const Botgram = require('botgram');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const { TELEGRAM_BOT_TOKEN } = process.env;
const bot = new Botgram(TELEGRAM_BOT_TOKEN);
var timers=[];
Moment().format();



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









/*
function calctime( time ){
  var range1 = moment.range(Moment(), Moment().add(6, 'h'));
  var range2 = moment.range(Moment(), Moment());
  range1.overlaps(range2);
}

*/
function pauseon(msg,reply){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].pause();
    reply.text(txt.pauseon).then(deletecmd(msg,reply));
    setTimeout(function(){},3600000);
  }
  else{
     deletecmd(msg,reply);
  }
}



function pauseoff(msg,reply){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].resume();
   // var index=parseInt(db.getData("/Sessions/"+msg.chat.id+"/turndata/actualturn"));
    reply.text(txt.pauseoff).then(deletecmd(msg,reply));
  }
  else{
     deletecmd(msg,reply);
  }
}



function whomustplay(msg,reply){
  db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
    if(session.started===true){
      db.readfilefromdb("Users", {id:session.actualturn,sessionid:msg.chat.id}).then(function(users){
        replytousr(msg.from.id,msg,reply,"è il turno di "+users.name).then(deletecmd(msg,reply));
      });
    }else{
      reply.text(txt. sessionnotstarted).then(deletecmd(msg,reply));
      console.log('session not started');
    }
  });
}



function replytousr(id,msg,reply, text){
  var replyto = bot.reply(id);

  return replyto.text(text);
}



function deletecmd(msg,reply){
  reply.deleteMessage(msg);
}



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
        .then(deletecmd(msg,reply))
        .then(function(){
          return db.readfilefromdb("Sessions", {id:msg.chat.id});})
        .then(function(result){reply.text("Il nome di questa campagna è "+result.name+"/SessionName");});
      }else{
        reply.text(txt.justcreate)
        .then(deletecmd(msg,reply));
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
                      id:msg.from.id
                    }
                  )
                  .then(reply.text(msg.from.name+" ora è un "+msg.args(1)[0]))
                  .then(deletecmd(msg,reply));
                }else{
                  reply.text("Esiste gia un master in questa sessione")
                  .then(deletecmd(msg,reply)); //CASO 4 RESPONSE
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
                  id:msg.from.id
                }
              )
              .then(reply.text(msg.from.name+" ora è un "+msg.args(1)[0]))
              .then(deletecmd(msg,reply));
            }
          }else{
            reply.text(msg.from.name+" esiste gia in questa sessione")
            .then(deletecmd(msg,reply)); //CASO 3 RESPONSE
          }
        });
      }else{
        reply.text("Dopo il comando /newusr inserisci solo pg o master\
                    per giocare nei panni di uno o dell'altro.")
        .then(deletecmd(msg,reply)); //CASO 2 RESPONSE
      }
    }else{
      reply.text(txt.sessionnotcreated)
      .then(deletecmd(msg,reply)); //CASO 1 RESPONSE
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
                reply.text("Sessione avviata Master è il tuo turno, inizia raccontando\
                            ai giocatori dove si trovano e cosa sta succedendo.")
                .then(deletecmd(msg,reply));
              });

            }else{// CASO 3 RESPONSE
                reply.text("Inserisci prima un master con /newusr master")
                .then(deletecmd(msg,reply));
            }
          });
        }else{ //CASO 2 RESPONSE
          if(session.started==undefined){
                reply.text(txt.sessionnotcreated)
                .then(deletecmd(msg,reply));
              }else{
          reply.text("Sessione gia in corso")
          .then(deletecmd(msg,reply));
              }
        }
      });
    }else{  //CASO 1 RESPONSE
      reply.text(txt.sessionnotcreated)
      .then(deletecmd(msg,reply));
    }
  });
}



function newmessage(msg,reply){

  db.readfilefromdb("Sessions",{id : msg.chat.id}).then(function(session){
    if(session){// CASO 1 ESISTE LA SESSIONE?
      if(session.started==true){
        if(session.actualturn==msg.from.id){
      if(timers[msg.chat.id] == null||timers[msg.chat.id]=="1"||timers[msg.chat.id].isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?

          db.createobj(
            "Messages",
            {
              usr : msg.from.id, sessionid : msg.chat.id , message : msg.args(1)[0]
            },
            {
              usr : msg.from.id, sessionid : msg.chat.id , message : msg.args(1)[0]
            },
          );
          callturn(msg , reply,session);

        }
        else{  // CASO 2 RESPONSE
          reply.text("Sessione in pausa").then(deletecmd(msg,reply));
        }

        }else{
          reply.text("Non è il tuo turno").then(deletecmd(msg,reply));
        }
      }else{
        reply.text(txt.sessionnotstarted).then(deletecmd(msg,reply));
      }
    }
    else{ // CASO 1 RESPONSE
      reply.text(txt.sessionnotcreated).then(deletecmd(msg,reply));
    }
  });
}



function callturn(msg , reply,chatdata){
    var actualindex=chatdata.actualturn;
    var totalindex=chatdata.totalturn+1;
  console.log(chatdata.totalturn);
    console.log(totalindex);
    var newindex=0;
    db.readfilefromdb("Users", {sessionid:msg.chat.id},true).then(function(users){

      newindex=users.map(function(x) {return x.id; }).indexOf(msg.from.id);
      newindex=(newindex+1)%users.length;
      db.modifyobj(
        "Sessions",
        {
          totalturn:totalindex,
          actualturn:users[newindex].id
        },
        {
          id: msg.chat.id
        }
      ).then(function(){console.log(chatdata.totalturn);
    console.log(totalindex);  waittoturn(msg,reply,totalindex,users[newindex],15000,15000,0,0)});
    });
}



function waittoturn(msg,reply,totalindex,usr,timea,timeb,timec,timed){
  db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=(timea+timeb+timec+timed)/60000;
      if(timea!=0){
        replytousr(usr.id,msg,reply,"è il tuo turno! Hai ancora "+ tim.toString() +"min per rispondere in "+usr.sessionname);
        timers[msg.chat.id]=pauseable.setTimeout(function(){
          waittoturn(msg,reply,totalindex,usr,timeb,timec,timed,0);
        },timea);
      }else{
        replytousr(usr.id,msg,reply,"Hai perso il turno");
        callturn(msg , reply,chatdata2);
      }
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
      .then(deletecmd(msg,reply));
    }else{
      deletecmd(msg,reply);
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
bot.command("pauseon", pauseon);
bot.command("pauseoff", pauseoff);
bot.command("reboot", reboot);
bot.command("deleteusr", deleteusr);
