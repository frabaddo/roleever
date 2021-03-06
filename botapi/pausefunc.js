const txt = require("../text/textexport_ita");
const support= require("./supportfunc");
const pauseable = require('./pauseableplus/pauseableplus');
const db = require("../databaseapi/mongoapi");

var pauseon=function (msg){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].timer.pause();
    timers[msg.chat.id].pausestart=Date.now();
    db.modifyobj(
      "Timers",
      {
        id:msg.chat.id,
        timestart:timers[msg.chat.id].timestart,
        pausestart:timers[msg.chat.id].pausestart,
        timeinpause:timers[msg.chat.id].timeinpause,
        timetodo:timers[msg.chat.id].timetodo
      },
      {id:msg.chat.id}
    ).then();
    //reply.text(txt.pauseon);
  }
  else{

  }
};



var pauseoff=function (msg){
  if (timers[msg.chat.id] != null){
    var tim=Date.now()-timers[msg.chat.id].pausestart;
    timers[msg.chat.id].timer.resume();
    timers[msg.chat.id].timeinpause= timers[msg.chat.id].timeinpause+tim;
    timers[msg.chat.id].pausestart=0;
    //console.log(timers[msg.chat.id].timeinpause);
    db.modifyobj(
      "Timers",
      {
        id:msg.chat.id,
        timestart:timers[msg.chat.id].timestart,
        pausestart:timers[msg.chat.id].pausestart,
        timeinpause:timers[msg.chat.id].timeinpause,
        timetodo:timers[msg.chat.id].timetodo
      },
      {id:msg.chat.id}
    ).then();
    //reply.text(txt.pauseoff);
  }
  else{
  }
};


var switchpauseon=function(query){
  var msg=query.message;
  if (timers[msg.chat.id] != null&&timers[msg.chat.id] != "1"){
    var reply = bot.reply(msg.chat);
    if(timers[msg.chat.id].timer.isPaused()!=true){
      db.readfilefromdb("Users",{sessionid:msg.chat.id,id:query.from.id,role:"master"}).then(function(user){
        if(user){
          pauseon(msg);
          reply.inlineKeyboard([
            [{text:"Termina pausa", callback_data: JSON.stringify({ action: "pauseoff"})}],
          ]).text(txt.pauseon);
        }
        else{
          query.answer({ text: txt.onlymasterpauseon, alert: true });
        }
      });
    }else{
      query.answer({ text: txt.onlymasterpauseon, alert: true });
    }
  }else{
    if (timers[msg.chat.id] == "1"){
      query.answer({ text: "Durante il turno del master il gioco non può essere messo in pausa. il suo turno durerà fino a quando non passerà!", alert: true });
    }
  }
};

var switchpauseoff=function(query){
  var msg=query.message;
  if (timers[msg.chat.id] != null&&timers[msg.chat.id] != "1"){
    var reply = bot.reply(msg.chat);
    if(timers[msg.chat.id].timer.isPaused()==true){
      db.readfilefromdb("Users",{sessionid:msg.chat.id,id:query.from.id,role:"master"}).then(function(user){
        if(user){
          pauseoff(msg);
          support.deletecmd(msg,reply);
        }
        else{
          query.answer({ text: txt.onlymasterpauseoff, alert: true });
        }
      });
    }else{
      support.deletecmd(msg,reply);
    }
  }else{
    console.log("errore timer");
  }
};

var reinitpausemsg=function(msg,reply){
  if(timers[msg.chat.id].timer.isPaused()==true){
    support.deletecmd(msg,reply);
    reply.inlineKeyboard([
      [{text:"Termina pausa", callback_data: JSON.stringify({ action: "pauseoff"})}],
    ]).text(txt.pauseon);
  }else{
    support.deletecmd(msg,reply);
  }
};

module.exports={
  pauseoff,
  pauseon,
  switchpauseon,
  switchpauseoff,
  reinitpausemsg
};
