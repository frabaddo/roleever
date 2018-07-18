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

         collection.findAndModify({
          query: unicprop,
          update: {
            $setOnInsert: params
          },
          new: true,   // return new doc if one is upserted
          upsert: true // insert the document if it does not exist
        });

         client.close();
         resolve();
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

         collection.findAndModify({
          query: unicprop,
          update: {
            $set: params
          }
        });

         client.close();
         resolve();
      });
    });
}



var existindb=function (collectionpar, params={}) {
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         const collection = client.db(db).collection(collectionpar);
         var result=collection.find(params);
         var bool=false;
         client.close();
         if(Object.keys(result).length != 0) bool=true;
         resolve(bool);
      });
    });
}



var readfilefromdb=function (collectionpar, params={}) {
    return new Promise((resolve,reject) => {
      MongoClient.connect(uri, function(err, client) {
         if(err) {
              console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
              reject(err);
         }
         console.log('Connected...');
         const collection = client.db(db).collection(collectionpar);
         var result=collection.find(params);
         client.close();
         resolve(result);
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
         var result=collection.count(params);
         client.close();
         resolve(result);
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
