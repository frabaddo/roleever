var replytousr=function (id , text){
  var replyto = bot.reply(id);

  return replyto.text(text);
}



var deletecmd=function (msg,reply){
  reply.deleteMessage(msg);
}

var deleteandretrieve=function(msg,reply){
  var keys=[
    [{text: "last message not send"}]
  ]
  reply.reply(msg).selective(true).keyboard(keys).deleteMessage(msg).text("ciao").then(function(err,result){deletecmd(result,reply);});
}


module.exports={
  deletecmd,
  replytousr,
  deleteandretrieve
}
