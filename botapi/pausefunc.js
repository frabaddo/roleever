const txt = require("../text/textexport_ita");

var pauseon=function (msg,reply){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].pause();
    reply.text(txt.pauseon).then(deletecmd(msg,reply));
    setTimeout(function(){},3600000);
  }
  else{
     deletecmd(msg,reply);
  }
}



var pauseoff=function (msg,reply){
  if (timers[msg.chat.id] != null){
    timers[msg.chat.id].resume();
   // var index=parseInt(db.getData("/Sessions/"+msg.chat.id+"/turndata/actualturn"));
    reply.text(txt.pauseoff).then(deletecmd(msg,reply));
  }
  else{
     deletecmd(msg,reply);
  }
}


module.exports={
  pauseoff,
  pauseon
}
