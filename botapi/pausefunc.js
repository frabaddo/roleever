const txt = require("../text/textexport_ita");
const support= require("./supportfunc");
const pauseable = require('./pauseableplus/pauseableplus');

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
        timetodo:[msg.chat.id].timetodo
      },
      {id:chatid},
      true
    );
    reply.text(txt.pauseon).then(support.deletecmd(msg,reply));
  }
  else{
     support.deletecmd(msg,reply);
  }
}



var pauseoff=function (msg,reply){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].timer.resume();
    timers[msg.chat.id].timeinpause= timers[msg.chat.id].timeinpause+Date.now()-timers[msg.chat.id].pausestart;
    timers[msg.chat.id].pausestart=0;
    console.log(timers[msg.chat.id].timeinpause);
    db.modifyobj(
      "Timers",
      {
        id:msg.chat.id,
        timestart:timers[msg.chat.id].timestart,
        pausestart:timers[msg.chat.id].pausestart,
        timeinpause:timers[msg.chat.id].timeinpause,
        timetodo:[msg.chat.id].timetodo
      },
      {id:chatid},
      true
    );
    reply.text(txt.pauseoff).then(support.deletecmd(msg,reply));
  }
  else{
     support.deletecmd(msg,reply);
  }
}


module.exports={
  pauseoff,
  pauseon
}
