const txt = require("../text/textexport_ita");
const support= require("./supportfunc");
const pauseable = require('./pauseableplus/pauseableplus');
const db = require("../databaseapi/mongoapi");

var pauseon=function (msg,reply){
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
    reply.text(txt.pauseon);
  }
  else{

  }
}



var pauseoff=function (msg,reply){
  if (timers[msg.chat.id] != null){
    var tim=Date.now()-timers[msg.chat.id].pausestart;
    timers[msg.chat.id].timer.resume();
    timers[msg.chat.id].timeinpause= timers[msg.chat.id].timeinpause+tim;
    timers[msg.chat.id].pausestart=0;
    console.log(timers[msg.chat.id].timeinpause);
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
    reply.text(txt.pauseoff);
  }
  else{
  }
}


var switchpause=function(query){
  if (timers[query.message.chat.id] != null){
    var reply = bot.reply(query.message.chat);
    if(timers[query.message.chat.id].timer.isPaused()==true){
      pauseoff(query.message,reply);
    }else{
      pauseon(query.message,reply);
    }
  }else{
    console.log("errore timer");
  }
}


module.exports={
  pauseoff,
  pauseon,
  switchpause
}
