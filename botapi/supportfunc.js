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
  reply.keyboard(keys).text("ciao").then(function(err,result){deletecmd(result,reply);});
  reply.deleteMessage(msg);
}


module.exports={
  deletecmd,
  replytousr,
  deleteandretrieve
}
