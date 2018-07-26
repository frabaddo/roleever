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
  db.createobj(
    "Timers",
    {
      id:chatid,
      timestart:Date.now(),
      pausestart:0,
      timeinpause:0,
      timetodo:time
    },
    {id:chatid}
  )
  .then(
    function(){
      db.modifyobj(
        "Timers",
        {
          id:chatid,
          timestart:Date.now(),
          pausestart:0,
          timeinpause:0,
          timetodo:time
        },
        {id:chatid}
      ).then(
        function(){
          if(pause) {
            timers[chatid].timer.pause();
            db.modifyobj(
              "Timers",
              {
                id:chatid,
                timestart:timers[chatid].timestart,
                pausestart:timers[chatid].pausestart,
                timeinpause:timers[chatid].timeinpause,
                timetodo:timers[chatid].timetodo
              },
              {id:chatid}
            ).then();
          }
        }
      );
    }
  );
}

module.exports={
  setTimeout
}
