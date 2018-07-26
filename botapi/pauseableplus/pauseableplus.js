const Pauseable = require('pauseable');
const moment = require('moment');
const db = require("../../databaseapi/mongoapi");

var setTimeout=function(chatid,callback,time,pause=false){
  timers[chatid]={
    id:chatid,
    timestart:Date.now(),
    pausestart:0,
    timeinpause:0,
    timetodo:time,
    timer:Pauseable.setTimeout(callback,time[0])
  };
  if(pause){
    timers[chatid].timer.pause();
    timers[chatid].pausestart=Date.now();
  }
  db.createobj(
    "Timers",
    {
      id:chatid,
      timestart:timers[chatid].timestart,
      pausestart:timers[chatid].pausestart,
      timeinpause:timers[chatid].timeinpause,
      timetodo:time
    },
    {id:chatid}
  )
  .then();
  db.modifyobj(
    "Timers",
    {
      id:chatid,
      timestart:timers[chatid].timestart,
      pausestart:timers[chatid].pausestart,
      timeinpause:timers[chatid].timeinpause,
      timetodo:time
    },
    {id:chatid}
  ).then();
}

module.exports={
  setTimeout
}
