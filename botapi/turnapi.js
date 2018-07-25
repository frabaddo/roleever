const db = require("./databaseapi/mongoapi");
const support= require("./botapi/supportfunc");

var callturn=function (msg , reply, currentid){
    db.readfilefromdb("Sessions",{id : msg.chat.id}).then(function(chatdata){
      var actualindex=chatdata.actualturn;
      var totalindex=chatdata.totalturn+1;
      console.log(chatdata.totalturn);
      console.log(totalindex);
      var newindex=0;
      db.readfilefromdb("Users", {sessionid:msg.chat.id},true).then(function(users){

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
            id: msg.chat.id
          }
        ).then(function(){console.log(chatdata.totalturn);
      console.log(totalindex);  waittoturn(msg,reply,totalindex,users[newindex],15000,15000,0,0)});
      });
    });
}

var waittoturn=function (msg,reply,totalindex,usr,timea,timeb,timec,timed){
  db.readfilefromdb("Sessions", {id:msg.chat.id}).then(function(chatdata2){
    console.log(chatdata2.totalturn);
    console.log(totalindex);
     if(chatdata2.totalturn==totalindex){
      var tim=(timea+timeb+timec+timed)/60000;
      if(timea!=0){
        support.replytousr(usr.id,msg,reply,txt.yourturn+ tim.toString() +txt.mintoresp+chatdata2.sessionname);
        timers[msg.chat.id]=pauseable.setTimeout(function(){
          waittoturn(msg,reply,totalindex,usr,timeb,timec,timed,0);
        },timea);
        //db.createobj("Timers",{sessionid:msg.chat.id,timestamp:0,remainig:tim})
      }else{
        support.replytousr(usr.id,msg,reply,txt.loseturn);
        callturn(msg , reply,usr.id);
      }
     }
  });
}

module.exports={
  callturn
}
