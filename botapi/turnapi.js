const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const txt = require("../text/textexport_ita");
const pauseable = require('./pauseableplus/pauseableplus');
var mapValues = require('object.map');

var callturn=function (chatid , currentid){
    db.readfilefromdb("Sessions",{id : chatid}).then(function(chatdata){
      var actualindex=chatdata.actualturn;
      var totalindex=chatdata.totalturn+1;
      console.log(chatdata.totalturn);
      console.log(totalindex);
      var newindex=0;
      db.readfilefromdb("Users", {sessionid:chatid},true).then(function(users){

        newindex=users.map(function(x) {return x.id; }).indexOf(currentid); //figlio di puttana
        console.log("il vecchio index è: "+newindex);
        newindex=(newindex+1)%users.length;
        console.log("il nuovo index è: "+newindex);
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
      console.log(totalindex);  waittoturn(chatid,totalindex,users[newindex].id,15000,15000,0,0)});
      });
    });
}

var waittoturn=function (chatid,totalindex,usrid,timea,timeb,timec,timed){
  db.readfilefromdb("Sessions", {id:chatid}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=(timea+timeb+timec+timed)/60000;
      if(timea!=0){
        support.replytousr(usrid,txt.yourturn+ tim.toString() +txt.mintoresp+chatdata2.sessionname);
        pauseable.setTimeout(chatid,function(){
          waittoturn(chatid,totalindex,usr,timeb,timec,timed,0);
        },[timea,timeb,timec,timed]);
      }else{
        support.replytousr(usrid,txt.loseturn);
        callturn(chatid ,usrid);
      }
     }
  });
}

async function reinitturn(chatid,totalindex,usrid,timea,timeb,timec,timed){
  db.readfilefromdb("Sessions", {id:chatid}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=(timea+timeb+timec+timed)/60000;
      if(timea!=0){
        pauseable.setTimeout(chatid,function(){
          waittoturn(chatid,totalindex,usrid,timeb,timec,timed,0);
        },[timea,timeb,timec,timed]);
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
        var totalturn=chatdata.totalturn;
        var timea=Date.now()-timer.timestart;
        timea-=timer.timeinpause;
        timea=timer.timetodo[0]-timea;
        waittoturn(timer.id,totalturn,usr,Math.max(timea,0),timer.timetodo[1],timer.timetodo[2],timer.timetodo[3]);
      });
    });
  });
}

/*var savetimer=function(signal){
  console.log("Restart in questo istante");
  var timerstopass=[];
  var timersprop=mapValues(timers,function(element, key, obj){
      return {
        id:element.id,
        timestart:element.timestart,
        pausestart:element.pausestart,
        timeinpause:element.timeinpause,
        timetodo:element.timetodo,
      }
  });
  Object.keys(timersprop).forEach(function(key) {
    timerstopass.push(timersprop[key]);
  });
  db.addmodobjs("Timers",timerstopass,"id").then(console.log("done"));
}
*/
module.exports={
  callturn,
  inittimers
}
