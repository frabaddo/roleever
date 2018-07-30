var replytousr=function (id , text){
  var replyto = bot.reply(id);

  return replyto.text(text);
}



var deletecmd=function (msg,reply){
  reply.deleteMessage(msg);
}

var deleteandretrieve=function(msg,reply){
  var keys=[
    [{text: msg.text}]
  ]
  reply.keyboard(keys).text("you can't send message, i save it in your keyboard");
  reply.deleteMessage(msg);
}


module.exports={
  deletecmd,
  replytousr,
  deleteandretrieve
}
