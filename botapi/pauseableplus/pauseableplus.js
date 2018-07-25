const pauseable = require('pauseable');
const moment = require('moment');


var setTimeout=function(id,callback,time){
  timers[id].timestart=Date.now();
  timers[id].pausestart=0;
  timers[id].timeinpause=0;
  timers[id].timer=pauseable.setTimeout(callback,time);
}



var initpauseable

module.export={
  setTimeout
}
