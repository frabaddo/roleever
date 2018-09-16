const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const turn= require("./turnapi");
const txt = require("../text/textexport_ita");


//msg.chat.id
var masterplayerkeyboard= function(chatid,id,players){
  var mkey=[
      [
        {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: chatid})},
        {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
      ]
    ];
  var pkey=[
      [
        {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: chatid})},
        {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
      ],
      [
        {text:"Add Roll", callback_data: JSON.stringify({ action: "addroll", chatid: chatid})}
      ]
    ];
    players.forEach(function(p){
      if(p.role=="pg"&&p.ready==true){
        mkey.push([{text: p.charactername+": -1pf", callback_data: JSON.stringify({ action: "makedamage", id: p.id,chatid: chatid})},{text: p.charactername+": +1pf", callback_data: JSON.stringify({ action: "healdamage", id: p.id,chatid: chatid})}]);
      }
      //if(p.role=="pg"&&p.id==id) return pkey;
    });
    var player = players.find(function(element) {
      if(element.id==id)return element;
    });
    if (player.role=="master") return mkey;
    else return pkey;
}

function newmessage(msg,reply,next){
  if(msg.chat.type!="group"&&msg.chat.type!="supergroup"){
    console.log("1");
   //reply.text(txt.bootnogroup);
   next();
  }
  else{
    db.readfilefromdb("Sessions",{id : msg.chat.id}).then(function(session){
      if(session){// CASO 1 ESISTE LA SESSIONE?
        if(session.started==true){
          if(timers[msg.chat.id] == null||timers[msg.chat.id]=="1"||timers[msg.chat.id].timer.isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?
            if(session.actualturn==msg.from.id){


              var replytousr = bot.reply(msg.from.id);
              db.readfilefromdb("Users", {sessionid:msg.chat.id},true).then(function(users){
                var keyboard= masterplayerkeyboard(msg.chat.id,msg.from.id,users);
                replytousr.inlineKeyboard(keyboard);

                var txttosend= "<strong>"+txt.wanttosend+"</strong>"+"\n \n"+msg.text;

                replytousr.html(txttosend).then(function(err,result){
                  support.deletecmd(msg,reply);
                  var damage=session.playersdamage;
                  Object.keys(damage).forEach(v => damage[v] = 0);
                  db.modifyobj(
                    "Sessions",
                    {
                      playersdamage:damage,
                      messagedamage:result.id
                    },
                    {id:msg.chat.id}
                  );
                });
              });
            }
            else{  // CASO 2 RESPONSE
              support.replytousr(msg.from.id,txt.isnotturn).then(support.deletecmd(msg,reply));
            }

          }else{
            support.replytousr(msg.from.id,txt.pauseon).then(support.deletecmd(msg,reply));
          }
        }else{
          support.deletecmd(msg,reply)
          //reply.text(txt.sessionnotstarted).then(support.deletecmd(msg,reply));
        }
      }
      else{ // CASO 1 RESPONSE
        reply.text(txt.sessionnotcreated).then(support.deletecmd(msg,reply));
      }
    });
  }
}

function deletesentmessage(query){
  var reply = bot.reply(query.message.chat);
  support.deletecmd(query.message.id,reply);
}

function  sendmessage(query,chatid){
  var reply = bot.reply(query.message.chat);
  var replytochat = bot.reply(chatid);

  db.readfilefromdb("Sessions",{id : chatid}).then(function(session){
    if(session){// CASO 1 ESISTE LA SESSIONE?
      db.readfilefromdb("Users",{sessionid:chatid},true).then(function(users){
        if(session.started==true){
          if(timers[chatid] == null||timers[chatid]=="1"||timers[chatid].timer.isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?
            if(session.actualturn==query.from.id){

              var charnamefrom=users.find(x => x.id == query.from.id);
              if(charnamefrom.role=="pg") charnamefrom=charnamefrom.charactername;
              else charnamefrom="Master";

              var txttosend=query.message.text.replace(txt.wanttosend,"<strong>"+charnamefrom+":"+"</strong>");
              support.deletecmd(query.message.id,reply);
              replytochat.html(txttosend);
              reply.html(txt.msgsent);
              var timetoset=Date.now();
              db.createobj(
                "Messages",
                {
                  usr : query.from.id, sessionid : chatid , time: timetoset , message : query.message.text
                },
                {
                  usr : query.from.id, sessionid : chatid , time : timetoset
                },
              );

              var damage=session.playersdamage;
              console.log(Object.keys(damage));
              for(var v in damage ){
                if(damage[v] != 0){
                  console.log( v+"  ///  "+chatid);

                  console.log(users);
                  var user=users.find(x => x.id == v);
                  console.log(user);
                  var damagereduc=user.pf-damage[v];
                  db.modifyobj("Users",{pf:damagereduc},{ id:user.id, sessionid:chatid});

                }
              }
              turn.callturn(chatid , query.from.id);
              /*support.forEachPromise(Object.keys(damage),function(v){
                if(damage[v] != 0){
                  console.log( v+"  ///  "+chatid);
                  db.readfilefromdb("Users",{id:v,sessionid:chatid}).then(function(u){
                    console.log(u);
                    var damagereduc=u.pf-damage[v];
                    db.modifyobj("Users",{pf:damagereduc},{ id:v, sessionid:chatid});
                  });
                }
              }).then(function(){
                turn.callturn(chatid , query.from.id);
              })*/
            }
            else{  // CASO 2 RESPONSE
              support.replytousr(query.from.id,txt.isnotturn);
            }

          }else{
            support.replytousr(query.from.id,txt.pauseon);
          }
        }else{
          support.replytousr(query.from.id.sessionnotstarted);
        }
      });
    }
    else{ // CASO 1 RESPONSE
      support.replytousr(query.from.id.sessionnotcreated);
    }
  });
}


module.exports={
  newmessage,
  sendmessage,
  deletesentmessage,
  masterplayerkeyboard
}
