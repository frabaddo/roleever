const Pauseable = require('pauseable');
const moment = require('moment');


var setTimeout=function(id,callback,time){
  timers[id]={
    timestart:Date.now(),
    pausestart:0,
    timeinpause:0,
    timer:Pauseable.setTimeout(callback,time)
  }
}

module.exports={
  setTimeout
}
