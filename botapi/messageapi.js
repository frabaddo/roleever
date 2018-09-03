const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const turn= require("./turnapi");
const txt = require("../text/textexport_ita");


//msg.chat.id
var masterplayerkeyboard= function(chatid,id,players=false){
  var mkey=[
      [
        {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: chatid})},
        {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
      ],
      [
        {text:"Infliggi danni", callback_data: JSON.stringify({ action: "makedamage", chatid: chatid})}
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
      if(p.role=="pg"){
        mkey.push([{text: p.charactername+": -1pf", callback_data: JSON.stringify({ action: "makedamage",d:"-", id: p.id})}],
                    [{text: p.charactername+": +1pf", callback_data: JSON.stringify({ action: "makedamage",d:"+", id: p.id})}]);
      }
      else if(p.role=="master"&&p.id==id) return pkey;
    });
    return mkey;
}

function newmessage(msg,reply,next){
  if(msg.chat.type!="supergroup"){
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
              db.readfilefromdb("Users", {sessionid:chatid},true).then(function(users){
                var keyboard= masterplayerkeyboard(msg.chat.id,msg.from.id,users);
                replytousr.inlineKeyboard(keyboard);

                var txttosend= "<strong>"+txt.wanttosend+"</strong>"+"\n \n"+msg.text;

                replytousr.html(txttosend).then(support.deletecmd(msg,reply));
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
      if(session.started==true){
        if(timers[chatid] == null||timers[chatid]=="1"||timers[chatid].timer.isPaused()!=true){ //CASO 2 SESSIONE IN PAUSA?
          if(session.actualturn==query.from.id){
            var txttosend=query.message.text.replace(txt.wanttosend,"<strong>"+query.from.name+":"+"</strong>");
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
            turn.callturn(chatid , query.from.id);
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
    }
    else{ // CASO 1 RESPONSE
      support.replytousr(query.from.id.sessionnotcreated);
    }
  });
}


module.exports={
  newmessage,
  sendmessage,
  deletesentmessage
}
