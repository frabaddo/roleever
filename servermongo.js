require('dotenv').config();
var express = require('express');
var app = express();

const MongoClient = require('mongodb').MongoClient;
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

const uri = "mongodb://User1:"+process.env.PASSWORD+"@cluster0-shard-00-00-okonn.mongodb.net:27017,cluster0-shard-00-01-okonn.mongodb.net:27017,cluster0-shard-00-02-okonn.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
MongoClient.connect(uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('Connected...');
   const collection = client.db("database").collection("Sessions");
   // perform actions on the collection object
   client.close();
});










function calctime( time ){
  var range1 = moment.range(Moment(), Moment().add(6, 'h'));
  var range2 = moment.range(Moment(), Moment());
  range1.overlaps(range2);
}




function replytousr(id,msg,reply, text){
  var replyto = bot.reply(id);

  return replyto.text(text);
}


function getelement(arraypath ,property, valuetofind ){
  try{
    var array=db.getData(arraypath);
    let newArr = array.filter(function(item){
        return item[property] === valuetofind;
    });
    if (newArr.length!=0){
      return newArr;
    }
    else return [];
  }
  catch(errore){
    return [];
  }
}

function deletecmd(msg,reply){
  reply.deleteMessage(msg);
}

function itsyourturn(msg){
  var myindex=db.getData("/Sessions/"+msg.chat.id+"/users").map(function(x) {return x.name; }).indexOf(msg.from.id);
  if(db.getData("/Sessions/"+msg.chat.id+"/turndata/actualturn")==myindex){
    return true
  }
  return false
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

function whomustplay(msg,reply){
  var index=parseInt(db.getData("/Sessions/"+msg.chat.id+"/turndata/actualturn"));
  replytousr(msg.from.id,msg,reply,"è il turno di "+ db.getData("/Sessions/"+msg.chat.id+"/users")[index].first_last ).then(deletecmd(msg,reply));
}


function startbot(msg,reply){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text("Ciao Sono un bot per giocare ai gdr su dispositivi mobile, per potermi utilizzare inseriscimi prima in un supergruppo e rendimi amministratore");
  }
  else{
    try {
      if(db.getData("/Sessions/"+msg.chat.id+"/SessionName")){  //CASO 1 ESISTE LA SESSIONE?
        reply.text("Sessione già creata, inserisci giocatori con /newusr o avvia la sessione con /startsession").then(deletecmd(msg,reply));
      }
    }catch(error){
      db.push("/Sessions/"+msg.chat.id+"/SessionName",msg.chat.title);
        reply.text("Benvenuto in RoleEver!!! Io sarò il vostro MasterBot da ora in poi.\
                    se dovessi avere bisogno di aiuto usa pure tutti i mei comandi,\
                    e se non li conosci digita /help. Prima di iniziare assicuratevi\
                    che io sia un amministratore del gruppo e controllate di aver tutti\
                    silenziato la chat. durante tutto il gioco sarò sempre io a preoccuparmi\
                    di mandarvi le notifiche. ora oguno di voi digiti il comando /newusr seguito\
                    dal ruolo che svolgerà (master o pg). il resto delle istruzioni vi saranno date\
                    in privato. Buon divertimento!!! ")
          .then(deletecmd(msg,reply))
          .then(reply.text("Il nome di questa campagna è "+db.getData("/Sessions/"+msg.chat.id+"/SessionName")));
    }

  }
}

function newusr(msg,reply){
  try {
    if(db.getData("/Sessions/"+msg.chat.id+"/SessionName")){  //CASO 1 ESISTE LA SESSIONE?

      if(msg.args(1)[0]=="pg"||msg.args(1)[0]=="master"){  //CASO 2 è STATO PASSATO UN PARAMETRO CORRETTO

        if(getelement("/Sessions/"+msg.chat.id+"/users", "name" ,msg.from.id).length==0){  //CASO 3 ESISTE GIA QUESTO GIOCATORE NELLA SESSIONE?

          if(msg.args(1)[0]=="pg"||getelement("/Sessions/"+msg.chat.id+"/users", "role" ,"master").length==0){  //CASO 4 SE IMMESSO MASTER, ESISTE GIA UN MASTER DELLA SESSIONE?

            db.push("/Sessions/"+msg.chat.id+"/users[]",{name:msg.from.id, first_last:msg.from.name, role:msg.args(1)[0]});
            reply.text(msg.from.name+" ora è un "+msg.args(1)[0]).then(deletecmd(msg,reply));

          }
          else{
            reply.text("Esiste gia un master in questa sessione").then(deletecmd(msg,reply)); //CASO 4 RESPONSE
          }
        }
        else{
          //reply.text(getelement("/Sessions/"+msg.chat.id+"/users", "name" ,msg.from.id).length);
          reply.text(msg.from.name+" esiste gia in questa sessione").then(deletecmd(msg,reply)); //CASO 3 RESPONSE
        }
      }
      else{
        reply.text("Dopo il comando /newusr inserisci solo pg o master per giocare nei panni di uno o dell'altro.").then(deletecmd(msg,reply)); //CASO 2 RESPONSE
      }
    }
  }catch(error) {
    reply.text("Sessione non aancora creata, usa prima il comando /startbot").then(deletecmd(msg,reply)); //CASO 1 RESPONSE
  }
}

function startsession(msg,reply){
   try {
    if(db.getData("/Sessions/"+msg.chat.id+"/SessionName")){ //CASO 1 ESISTE LA SESSIONE?
      try {
        if(db.getData("/Sessions/"+msg.chat.id+"/turndata/totalturn")){ //CASO 2 è STATA AVVIATA LA SESSIONE?
          reply.text("Sessione gia in corso").then(deletecmd(msg,reply));
        }
      }catch(error){ //CASO 2 RESPONSE
        if(getelement("/Sessions/"+msg.chat.id+"/users", "role" ,"master").length==1){// CASO 3 ESISTE IL MASTER?
            var masterindex=db.getData("/Sessions/"+msg.chat.id+"/users").map(function(x) {return x.role; }).indexOf("master");
            db.push("/Sessions/"+msg.chat.id+"/turndata/totalturn","1");
            db.push("/Sessions/"+msg.chat.id+"/turndata/actualturn",masterindex);
            timers[msg.chat.id]="1";
            reply.text("Sessione avviata Master è il tuo turno, inizia raccontando\
                        ai giocatori dove si trovano e cosa sta succedendo.")
            .then(deletecmd(msg,reply));
        }
        else{
          reply.text("Inserisci prima un master con /newusr master").then(deletecmd(msg,reply)); //CASO 3 RESPONSE
        }
      }
    }
   }catch(error){ //CASO 1 RESPONSE
     reply.text("Sessione non ancora creata, usa prima il comando /startbot e aggiungi dei giocatori con /newusr").then(deletecmd(msg,reply));
   }
}





function newmessage(msg,reply){
 try {
    if(db.getData("/Sessions/"+msg.chat.id+"/SessionName")){ //CASO 1 ESISTE LA SESSIONE?
        if(getelement("/Sessions/"+msg.chat.id+"/users" ,"name", msg.from.id ).length==1){ //CASO 2 ESISTE GIA IL GIOCATORE?
          try {
            if(db.getData("/Sessions/"+msg.chat.id+"/turndata/totalturn")){ //CASO 3 è STATA AVVIATA LA SESSIONE?
              if(timers[msg.chat.id] == null||timers[msg.chat.id]=="1"||timers[msg.chat.id].isPaused()!=true){ //CASO 4 SESSIONE IN PAUSA?
                if(itsyourturn(msg)){  //  CASO 5 è IL TUO TURNO?
                  db.push("/Sessions/"+msg.chat.id+"/messages[]" , {"usr":msg.from.id,"message":msg.args(1)[0]});

                  callturn(msg , reply);   //ERRORE QUI MANCA TRY CATCH //Cedi il turno e verfica se cederlo ulteriormente nel caso in cui termini il tempo

                }
                else{  // CASO 5 RESPONSE
                  reply.text("Non è il tuo turno").then(deletecmd(msg,reply));
                }
              }
              else{ // CASO 4 RESPONSE
                reply.text("Sessione in pausa").then(deletecmd(msg,reply));
              }
            }
          }catch(error){ // CASO 3 RESPONSE
            reply.text("Sessione non ancora avviata").then(deletecmd(msg,reply));
          }
        }
        else{// CASO 2 RESPONSE
        reply.text("giocatore non ancora registrato, usa il comando /newusr").then(deletecmd(msg,reply));
        }
    }
  }catch(error){ // CASO 1 RESPONSE
    reply.text("Sessione non ancora creata, usa prima il comando /start").then(deletecmd(msg,reply));
  }
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

function help(msg,reply){
 reply.text();
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
  var myindex=db.getData("/Sessions/"+msg.chat.id+"/users").map(function(x) {return x.name; }).indexOf(nome);
  db.delete("/Sessions/"+msg.chat.id+"/users["+myindex+"]");
}



function reboot(msg,reply){
   try {
    if(db.getData("/Sessions/"+msg.chat.id+"/SessionName")){ //CASO 1 ESISTE LA SESSIONE?
      try {
        if(db.getData("/Sessions/"+msg.chat.id+"/turndata/totalturn")&&msg.args(1)[0]=="password"){ //CASO 2 è STATA AVVIATA LA SESSIONE?
          var masterindex=db.getData("/Sessions/"+msg.chat.id+"/users").map(function(x) {return x.role; }).indexOf("master");
            db.push("/Sessions/"+msg.chat.id+"/turndata/totalturn","1");
            db.push("/Sessions/"+msg.chat.id+"/turndata/actualturn",masterindex);
            timers[msg.chat.id]="1";
            reply.text("Sessione riavviata Master è il tuo turno. DEBUG")
            .then(deletecmd(msg,reply));
        }
        else{
          deletecmd(msg,reply);
        }
      }catch(error){ //CASO 2 RESPONSE

      }
    }
   }catch(error){ //CASO 1 RESPONSE

   }
}
