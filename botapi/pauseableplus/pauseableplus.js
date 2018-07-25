const Pauseable = require('pauseable');
const moment = require('moment');


var setTimeout=function(chatid,callback,time){
  timers[chatid]={
    id:chatid,
    timestart:Date.now(),
    pausestart:0,
    timeinpause:0,
    timetodo:time,
    timer:Pauseable.setTimeout(callback,time[0])
  }
}

module.exports={
  setTimeout
}
