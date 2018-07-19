//require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

const uri ="mongodb://User1:"+process.env.PASSWORD+"@cluster0-shard-00-00-okonn.mongodb.net:27017,cluster0-shard-00-01-okonn.mongodb.net:27017,cluster0-shard-00-02-okonn.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
const db = "database";





var createobj=function (collectionname, params,unicprop) {
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         const collection = client.db(db).collection(collectionname);

         var result=collection.findAndModify(
          unicprop,
          [['_id','asc']],
          {
            $setOnInsert: params
          },
          {
            new: true,   // return new doc if one is upserted
            upsert: true // insert the document if it does not exist
          }

        ).then(function(){
           client.close();
           resolve(result);
         });


      });
    });
}

var modifyobj = function (collectionname, params={},unicprop={}){
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         const collection = client.db(db).collection(collectionname);

         collection.findAndModify(
           unicprop,
           [['_id','asc']],
          {
            $set: params
          }
        ).then(function(){
           client.close();
           resolve();
         });

      });
    });
}



var existindb=function (collectionpar, params) {
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         var collection = client.db(db).collection(collectionpar);
         collection.find(params).count().then(function(count){
           console.log(count);
           client.close();
           if(count == 0)resolve(false);
           else resolve(true);
         });
      });
    });
}



var readfilefromdb=function (collectionpar, params={}, all=false) {
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         const collection = client.db(db).collection(collectionpar);
         collection.find(params).toArray().then(function(result){
           console.log(result[0]);
           if(all){
             if (result.lenght!=0){
               collection.find(params).sort({_id:1}).toArray()
               .then(function(arrresult){
                 console.log(arrresult);
                 client.close();
                 resolve(arrresult);
               });
             }
             else{
               resolve(false);
               client.close();
             }
           }else{
             if (result.lenght!=0){
               client.close();
               resolve(result[0]);
             }
             else{
               client.close();
               resolve(false);
             }
           }
          });

      });
    });
}

var countindb=function (collectionpar, params={}) {
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         const collection = client.db(db).collection(collectionpar);
         collection.find(params).count().then(function(count){client.close();resolve(count);});

      });
    });
}

var deletefromdb=function (collectionpar, params={}) {
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         const collection = client.db(db).collection(collectionpar);
         var result=collection.deleteOne(params);
         client.close();
         resolve(result);
      });
    });
}

/*module.export.readfilefromdb=readfilefromdb;
module.export.modifyobj=modifyobj;
module.export.createobj= createobj;
module.export.existindb=existindb;
module.export.countindb=countindb;
module.export.deletefromdb=deletefromdb;
*/
module.exports={
readfilefromdb,
modifyobj,
createobj,
existindb,
countindb,
deletefromdb,
}
