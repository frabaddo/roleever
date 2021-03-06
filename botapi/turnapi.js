const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const txt = require("../text/textexport_ita");
const moment = require('moment');
const pauseable = require('./pauseableplus/pauseableplus');
var mapValues = require('object.map');

var callturn=function (chatid , currentid){
  db.readfilefromdb("Sessions",{id : chatid}).then(function(chatdata){
    var totalindex=chatdata.totalturn+1;
    console.log(chatdata.totalturn);
    console.log(totalindex);
    var newindex=0;
    db.readfilefromdb("Users", {sessionid:chatid},true).then(function(users){

      newindex=calcnewindex(users,currentid,1);

      console.log("il nuovo index accettabile è: "+newindex);
      if(newindex!==false){
        db.modifyobj(
          "Sessions",
          {
            totalturn:totalindex,
            actualturn:users[newindex].id
          },
          {
            id: chatid
          }
        ).then(function(){console.log(chatdata.totalturn);
          var interval=chatdata.hours/4;
          console.log(totalindex);
          waittoturn(chatid,totalindex,users[newindex].id,interval,interval,interval,interval);
        });
      }
      else{
        db.modifyobj(
          "Sessions",
          {
            totalturn:totalindex,
            actualturn:0
          },
          {
            id: chatid
          }
        );
      }
    });
  });
};

var skipturn=function(query){
  var chatid=query.message.chat.id;
  var msg=query.message;
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
   }else{
     db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
       if(session){
         if(session.started===true){
          if(timers[msg.chat.id]){
              if(timers[msg.chat.id]=="1"||timers[msg.chat.id].timer.isPaused()!=true){
                 if(session.actualturn==query.from.id){
                   if(timers[msg.chat.id]=="1"){
                     support.replytousr(query.from.id,"Hai passato il turno, è ora il turno dei giocatori!");
                   }
                   else{
                     support.replytousr(query.from.id,txt.turnskip);
                     setTimeout(function(){
                        support.replytousr(chatid,"Un giocatore ha passato il turno!");
                     },1200);
                   }
                   query.answer({ text: txt.turnskip, alert: true });
                   callturn(chatid , session.actualturn);
                 }else{
                  query.answer({ text: txt.onlyactual, alert: true });
                 }
             }else{
               query.answer({ text: txt.pauseactive, alert: true });
             }
         }else{
           query.answer({ text: "Sessione non ancora avviata!", alert: true });
         }
        }
       }
     });
   }
};

function calcnewindex(users,currentid,i){
  var index=users.map(function(x) {return x.id; }).indexOf(currentid);
  console.log("il vecchio index è: "+index);
  index=(index+1)%users.length;
  if(users[index].ready==true&&users[index].join==true) return index;
  else{
    if(i<users.length) return calcnewindex(users,users[index].id,i+1);
    else return false;
  }
}

var waittoturn=function (chatid,totalindex,usrid,timea,timeb,timec,timed){
  db.readfilefromdb("Sessions", {id:chatid}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=timea+timeb+timec+timed;
      var tempTime = moment.duration(tim);
      var y = tempTime.hours() + ":" + tempTime.minutes();
      if(timea!=0){
        db.readfilefromdb("Users", {id:usrid,sessionid:chatid}).then(function(user){
          if(user.role=="master"){
            timers[chatid]="1";
            support.replytousr(usrid,"Master, è il tuo turno, ora potrai inviare tutti i messaggi che vuoi. Quando avrai finito ricordati di passare il turno dal menu della sessione!");
          }
          else{
            support.replytousr(usrid,txt.yourturn+ y +txt.hourstoresp+chatdata2.sessionname);
            pauseable.setTimeout(chatid,function(){
              waittoturn(chatid,totalindex,usrid,timeb,timec,timed,0);
            },[timea,timeb,timec,timed]);
          }
        });
      }else{
        support.replytousr(usrid,txt.loseturn);
        callturn(chatid ,usrid);
      }
     }
  });
};

function reinitwait(chatid,totalindex,usrid,timea,timeb,timec,timed,pause){
  db.readfilefromdb("Sessions", {id:chatid}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=(timea+timeb+timec+timed)/60000;
      if(timea!=0 && usrid!=0){
        db.readfilefromdb("Users", {id:usrid,sessionid:chatid}).then(function(user){
          if(user.role=="master"){
            timers[chatid]="1";
            console.log(user.role);
          }
          else{
            pauseable.setTimeout(chatid,function(){
              waittoturn(chatid,totalindex,usrid,timeb,timec,timed,0);
            },[timea,timeb,timec,timed],pause);
          }
        });
      }else{
        console.log("qui");
        //callturn(chatid ,usrid);
      }
     }
  });
}

var inittimers=function(){
  db.readfilefromdb("Timers",{},true).then(function(arr){
    arr.forEach(function(timer){
      db.readfilefromdb("Sessions", {id:timer.id}).then(function(chatdata){
        /*var localtimeinpause=timer.timeinpause;
        if(timer.pausestart!=0){
          localtimeinpause=timer.timeinpause+Date.now()-timer.pausestart;
        }
        var totalturn=chatdata.totalturn;
        var timea=Date.now()-timer.timestart;
        var timeb=timea-localtimeinpause;
        var timec=timer.timetodo[0]-timeb;
        console.log("max: "+timec+" , 0 = "+Math.max(timec,0));*/
        var totalturn=chatdata.totalturn;
        var timerend=timer.pausestart||Date.now();
        var timetodo=timer.timetodo[0]-timerend+timer.timestart+timer.timeinpause;
        console.log(timer.id+" => tmetodo:"+timetodo);
        reinitwait(timer.id,totalturn,chatdata.actualturn,Math.max(timetodo,1),timer.timetodo[1],timer.timetodo[2],timer.timetodo[3],timer.pausestart!=0);
      });
    });
  });
  db.readfilefromdb("Sessions", {started:true,totalturn:1},true).then(function(sessionready){
    sessionready.forEach(function(session){
      timers[session.id]=1;
      console.log(session.sessionname);
    });
  });
};

function whomustplay(query){
  var reply = bot.reply(query.message.chat);
  var msg=query.message;
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
   reply.text(txt.bootnogroup);
 }else{
   db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(session){
     if(session){
       if(session.started===true){
         db.readfilefromdb("Users", {id:session.actualturn,sessionid:msg.chat.id}).then(function(users){
          var givename="";
          if(users.role=="pg"){
            givename=users.charactername;
          }else givename="Master";
          query.answer({ text:txt.turnof+givename, alert: true });
        });
       }else{
         query.answer({ text:txt.sessionnotstarted, alert: true });
       }
     }
   });
 }
}

module.exports={
  callturn,
  inittimers,
  whomustplay,
  skipturn
};
