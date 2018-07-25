const Pauseable = require('pauseable');
const moment = require('moment');
const db = require("../../databaseapi/mongoapi");

var setTimeout=function(chatid,callback,time){
  timers[chatid]={
    id:chatid,
    timestart:Date.now(),
    pausestart:0,
    timeinpause:0,
    timetodo:time,
    timer:Pauseable.setTimeout(callback,time[0])
  };
  db.modifyobj(
    "Timers",
    {
      id:chatid,
      timestart:Date.now(),
      pausestart:0,
      timeinpause:0,
      timetodo:time
    },
    {id:chatid},
    true
  );
}

module.exports={
  setTimeout
}
