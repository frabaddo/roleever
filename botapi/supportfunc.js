var replytousr=function (id,msg,reply, text){
  var replyto = bot.reply(id);

  return replyto.text(text);
}



var deletecmd=function (msg,reply){
  reply.deleteMessage(msg);
}


module.exports={
  deletecmd,
  replytousr
}
