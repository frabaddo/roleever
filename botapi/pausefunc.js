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
}



var pauseoff=function (msg){
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
    //reply.text(txt.pauseoff);
  }
  else{
  }
}


var switchpauseon=function(query){
  var msg=query.message;
  if (timers[msg.chat.id] != null&&timers[msg.chat.id] != "1"){
    var reply = bot.reply(msg.chat);
    if(timers[msg.chat.id].timer.isPaused()!=true){
      pauseon(msg);
      var reply = bot.reply(query.message.chat);
      reply.keyboard([
        [{text:"Termina pausa", callback_data: JSON.stringify({ action: "pauseoff"})}],
      ]).text(txt.pauseon);
    }else{

    }
  }else{
    console.log("errore timer");
  }
}

var switchpauseoff=function(query){
  var msg=query.message;
  if (timers[msg.chat.id] != null&&timers[msg.chat.id] != "1"){
    var reply = bot.reply(msg.chat);
    if(timers[msg.chat.id].timer.isPaused()==true){
      pauseoff(msg);
      support.deletecmd(msg,reply);
    }else{

    }
  }else{
    console.log("errore timer");
  }
}


module.exports={
  pauseoff,
  pauseon,
  switchpauseon,
  switchpauseoff
}
