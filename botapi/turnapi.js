const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const txt = require("../text/textexport_ita");
const moment = require('moment');
const pauseable = require('./pauseableplus/pauseableplus');
var mapValues = require('object.map');

var callturn=function (chatid , currentid){
    db.readfilefromdb("Sessions",{id : chatid}).then(function(chatdata){
      var totalindex=chatdata.totalturn+1;
      console.log(chatdata.totalturn);
      console.log(totalindex);
      var newindex=0;
      db.readfilefromdb("Users", {sessionid:chatid},true).then(function(users){

        newindex=calcnewindex(users,currentid,1);

        console.log("il nuovo index accettabile è: "+newindex);
        if(newindex!==false){
          db.modifyobj(
            "Sessions",
            {
              totalturn:totalindex,
              actualturn:users[newindex].id
            },
            {
              id: chatid
            }
          ).then(function(){console.log(chatdata.totalturn);
            var interval=chatdata.hours/4;
            console.log(totalindex);
            waittoturn(chatid,totalindex,users[newindex].id,interval,interval,interval,interval)
          });
        }
        else{
          db.modifyobj(
            "Sessions",
            {
              totalturn:totalindex,
              actualturn:0
            },
            {
              id: chatid
            }
          );
        }
      });
    });
}

function calcnewindex(users,currentid,i){
  var index=users.map(function(x) {return x.id; }).indexOf(currentid);
  console.log("il vecchio index è: "+index);
  index=(index+1)%users.length;
  if(users[index].ready==true) return index;
  else{
    if(i<users.length) return calcnewindex(users,users[index].id,i+1);
    else return false;
  }
}

var waittoturn=function (chatid,totalindex,usrid,timea,timeb,timec,timed){
  db.readfilefromdb("Sessions", {id:chatid}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=timea+timeb+timec+timed;
      var tempTime = moment.duration(tim);
      var y = tempTime.hours() + ":" + tempTime.minutes();
      if(timea!=0){
        support.replytousr(usrid,txt.yourturn+ y +txt.hourstoresp+chatdata2.sessionname);
        pauseable.setTimeout(chatid,function(){
          waittoturn(chatid,totalindex,usrid,timeb,timec,timed,0);
        },[timea,timeb,timec,timed]);
      }else{
        support.replytousr(usrid,txt.loseturn);
        callturn(chatid ,usrid);
      }
     }
  });
}

async function reinitwait(chatid,totalindex,usrid,timea,timeb,timec,timed,pause){
  db.readfilefromdb("Sessions", {id:chatid}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=(timea+timeb+timec+timed)/60000;
      if(timea!=0){
        pauseable.setTimeout(chatid,function(){
          waittoturn(chatid,totalindex,usrid,timeb,timec,timed,0);
        },[timea,timeb,timec,timed],pause);
      }else{
        callturn(chatid ,usrid);
      }
     }
  });
}

var inittimers=function(){
  db.readfilefromdb("Timers",{},true).then(function(arr){
    arr.forEach(function(timer){
      db.readfilefromdb("Sessions", {id:timer.id}).then(function(chatdata){
        var localtimeinpause=timer.timeinpause;
        if(timer.pausestart!=0){
          localtimeinpause=timer.timeinpause+Date.now()-timer.pausestart;
        }
        var totalturn=chatdata.totalturn;
        var timea=Date.now()-timer.timestart;
        var timeb=timea-localtimeinpause;
        var timec=timer.timetodo[0]-timeb;
        reinitwait(timer.id,totalturn,chatdata.actualturn,Math.max(timec,0),timer.timetodo[1],timer.timetodo[2],timer.timetodo[3],timer.pausestart!=0);
      });
    });
  });
}

module.exports={
  callturn,
  inittimers
}
