const db = require("../databaseapi/mongoapi");
const support= require("./supportfunc");
const turn= require("./turnapi");

function newmessage(msg,reply,next){
  if(msg.chat.type!="supergroup"){
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
              replytousr.inlineKeyboard([
                [
                  {text:"Invia", callback_data: JSON.stringify({ action: "sendmessage", chatid: msg.chat.id})},
                  {text:"Annulla", callback_data: JSON.stringify({ action: "deletemessage" })},
                ]
              ]);

              var txttosend= "<strong>"+txt.wanttosend+"</strong>"+"\n \n"+msg.text;

              replytousr.html(txttosend).then(support.deletecmd(msg,reply));

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
