require('dotenv').config();
var express = require('express');
var app = express();
const db = require("./databaseapi");
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

function callturn(msg , reply){
  var chatdata=db.getData("/Sessions/"+msg.chat.id+"/turndata");
  var actualindex=parseInt(chatdata.actualturn);
  var totalindex=parseInt(chatdata.totalturn)+1;
  var newindex=0;

  newindex=(actualindex + 1) % db.getData("/Sessions/"+msg.chat.id+"/users").length;
  db.push("/Sessions/"+msg.chat.id+"/turndata/totalturn",totalindex.toString());
  db.push("/Sessions/"+msg.chat.id+"/turndata/actualturn",newindex.toString());

  try{
    waittoturn(msg,reply,totalindex,newindex,6000000,3000000,3000000,3000000);
  }catch(error){

  }
}


function waittoturn(msg,reply,totalindex,newindex,timea,timeb,timec,timed){
  if(parseInt(db.getData("/Sessions/"+msg.chat.id+"/turndata/totalturn"))==totalindex){
    var tim=(timea+timeb+timec+timed)/60000;

    if(timea!=0){
      replytousr(db.getData("/Sessions/"+msg.chat.id+"/users")[newindex].name,msg,reply,"è il tuo turno! Hai ancora "+ tim.toString() +"min per rispondere in "+db.getData("/Sessions/"+msg.chat.id+"/SessionName"));
      timers[msg.chat.id]=pauseable.setTimeout(function(){
      waittoturn(msg,reply,totalindex,newindex,timeb,timec,timed,0);
      },timea);
    }
    else{
      replytousr(db.getData("/Sessions/"+msg.chat.id+"/users")[newindex].name,msg,reply,"Hai perso il turno");
      callturn(msg , reply);
    }
  }
}




function pauseon(msg,reply){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].pause();
    reply.text("Sessione in pausa, usa /pauseoff per sbloccarla. tutti i messaggi ora saranno bloccati!").then(deletecmd(msg,reply));
    setTimeout(function(){},3600000);
  }
  else{
     deletecmd(msg,reply);
  }
}

function pauseoff(msg,reply){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].resume();
    var index=parseInt(db.getData("/Sessions/"+msg.chat.id+"/turndata/actualturn"));
    reply.text("Sessione uscita dalla pausa, è ancora il turno di "+db.getData("/Sessions/"+msg.chat.id+"/users")[index].first_last).then(deletecmd(msg,reply));
  }
  else{
     deletecmd(msg,reply);
  }
}


*/



function whomustplay(msg,reply){
  db.readfilefromdb("Sessions", {id=msg.chat.id}).then(function(session){
    if(session.started===true){
      db.readfilefromdb("Users", {id=session.actualturn,sessionid=msg.chat.id}).then(function(users){
        replytousr(msg.from.id,msg,reply,"è il turno di "+users.name).then(deletecmd(msg,reply));
      });
    }else{

    }
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
 reply.text("Ciao "+msg.from.firstname+". /n Io sono il Masterbot, per iniziare a giocare, inseriscimi in un\
supergruppo e controlla che io sia un amministratore. fatto cio segui questi semplici passi (salvo casi esplicitati tutti i comandi sono da immetere nel supergruppo): \
1. crea la sessione inserendo il comando /startbot. \
2. fai in modo che ogni giocatore mi avvii in privato \
3. fai in modo che ogni giocatore inserisca il comando /newusr seguito da pg o master. ricorda che ci può essere un solo master.\
4. avviate la sessione con /startsession. (è sufficiente lo faccia un giocatore solo) \
Ogniqualvolta toccherà a te giocare usa il comando /msg seguito da un testo che racconti le tue gesta. \
se dovessi mai aver bisogno usa il comando /help (in privato) oppure contatta gli sviluppatori sull'apposito gruppo.  \
Buon divertimento!!!");
}

function startbot(msg,reply){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text("Ciao Sono un bot per giocare ai gdr su dispositivi mobile,\
              per potermi utilizzare inseriscimi prima in un supergruppo e\
              rendimi amministratore");
  }
  else{
    db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
      if(bool){
        reply.text("Sessione già creata, inserisci giocatori con\
                    /newusr o avvia la sessione con /startsession")
        .then(deletecmd(msg,reply));
      }else{
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
          reply.text("Benvenuto in RoleEver!!! Io sarò il vostro MasterBot da ora in poi.\
                      se dovessi avere bisogno di aiuto usa pure tutti i mei comandi,\
                      e se non li conosci digita /help. Prima di iniziare assicuratevi\
                      che io sia un amministratore del gruppo e controllate di aver tutti\
                      silenziato la chat. durante tutto il gioco sarò sempre io a preoccuparmi\
                      di mandarvi le notifiche. ora oguno di voi digiti il comando /newusr seguito\
                      dal ruolo che svolgerà (master o pg). il resto delle istruzioni vi saranno date\
                      in privato. Buon divertimento!!! ");})
        .then(deletecmd(msg,reply))
        .then(function(){
          return db.readfilefromdb("Sessions", {id=msg.chat.id});})
        .then(function(result){reply.text("Il nome di questa campagna è "+result.name+"/SessionName");});
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
              db.countindb("Users",{sessionid:msg.chat.id,role="master"}).then(function(master){ //CASO 4 SE IMMESSO MASTER, ESISTE GIA UN MASTER DELLA SESSIONE?
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
      reply.text("Sessione non aancora creata, usa prima il comando /startbot")
      .then(deletecmd(msg,reply)); //CASO 1 RESPONSE
    }
  });
}





function startsession(msg,reply){
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool){
      db.readfilefromdb("Sessions", {id=msg.chat.id}).then(function(session){
        if(session.started===false){ //CASO 2 è STATA AVVIATA LA SESSIONE?
          db.countindb("Users",{sessionid:msg.chat.id,role="master"}).then(function(master){
            if(master==1){// CASO 3 ESISTE IL MASTER?

              //AVVIA SESSIONE
              db.readfilefromdb("Users",{sessionid:msg.chat.id,role="master"}).then(function(master){
                db.modifyobj("Sessions",{actualturn:master.id},{id:msg.chat.id});
                timers[msg.chat.id]="1";
                reply.text("Sessione avviata Master è il tuo turno, inizia raccontando\
                            ai giocatori dove si trovano e cosa sta succedendo.")
                .then(deletecmd(msg,reply));*/
              });

            }else{// CASO 3 RESPONSE
              reply.text("Inserisci prima un master con /newusr master")
              .then(deletecmd(msg,reply));
            }
          });
        }else{ //CASO 2 RESPONSE
          reply.text("Sessione gia in corso")
          .then(deletecmd(msg,reply));
        }
      });
    }else{  //CASO 1 RESPONSE
      reply.text("Sessione non ancora creata, usa prima il comando /startbot e aggiungi dei giocatori con /newusr")
      .then(deletecmd(msg,reply));
    }
  });
}



function newmessage(msg,reply){

  db.countindb("Sessions",{sessionid : msg.chat.id,actualturn : msg.from.id,started:true}).then(function(session){
    if(session==1){// CASO 1 ESISTE LA SESSIONE, è STATA AVVIATA ED È IL TURNO DI QUESTO GIOCATORE?

      //if(timers[msg.chat.id] == null||timers[msg.chat.id]=="1"||timers[msg.chat.id].isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?

        db.createobj(
          "Messages",
          {
            usr : msg.from.id, sessionid : msg.chat.id , message : msg.args(1)[0]
          },
          {
            usr : msg.from.id, sessionid : msg.chat.id , message : msg.args(1)[0]
          },
        );
        //callturn(msg , reply);

      //}
      //else{  // CASO 2 RESPONSE
      //  reply.text("Sessione in pausa").then(deletecmd(msg,reply));
      //}
    }
    else{ // CASO 1 RESPONSE
      reply.text("Sessione non creata o non avviata oppure non è il tuo turno").then(deletecmd(msg,reply));
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






function deleteusr(msg,reply,nome){
  db.deletefromdb("Users",{sessionid:msg.chat.id,id:msg.from.id});
}



function reboot(msg,reply){
  db.existindb("Sessions",{id:msg.chat.id}).then(function(bool){  //CASO 1 ESISTE LA SESSIONE?
    if(bool&&msg.args(2)[1]=="password"){ //CASO 1 ESISTE LA SESSIONE e la password è corretta?
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
  }
}
