var path = require('path');
var archive = require('../helpers/archive-helpers');
var mongodb = require("mongodb");
var fs=require('fs');

var server = new mongodb.Server("127.0.0.1", 27017, {});
var client = new mongodb.Db('database', server);
var collection;

client.open(function(err, p_client) {
  console.log("Connected to MongoDB!");

  client.createCollection('museum', function(err, collection) {
    console.log("Created collection");

    //create sample entry
    var site = {url: "www.google.com",
                html: "<html><body>this is the body</body></html>"};

    // Insert it to the collection:
    collection.insert(site, function(err, results) {
      console.log("Inserted a website.");
    });
    var site2 = {url: "www.facebook.com",
                html: ""};
    // Insert it to the collection:
    collection.insert(site2, function(err, results) {
      console.log("Inserted a website.");
    });

  });

});

exports.handleRequest = function (req, res) {
  var headers=require('./http-helpers.js').headers;
  var statusCode;
  headers['Allow'] = 'HEAD, GET, PUT, DELETE, OPTIONS';

  if (req.method==='OPTIONS') {
    res.writeHead(200, headers)
    res.end();
  } else if (req.method==='POST') {
    //if message key in database has corresponding HTML file
    //  serve up txt html page
    //else if key not in database
      //add to database
    req.on('data', function(chunk) {
      var message= JSON.parse(chunk.toString());

      client.createCollection('museum', function(err, collection) {
        collection.find({url: message}).toArray(function(err, results) {
          
          if (results.length>0) {
            var returnHtml=results[0]['html'].toString();
            //return website if it's in there
            res.writeHead(200, headers);
            if (returnHtml.length>0) {
              res.end(returnHtml);
            } else {
              //serve up waiting page
              var fileName=path.join(process.cwd(), '../web/public', 'loading.html');
              var fileStream = fs.createReadStream(fileName);
              fileStream.pipe(res);
            }
          } else {
            //add website to mongo
             var site = {url: message,
                html: ""};

            // Insert it to the collection:
            collection.insert(site, function(err, results) {
              console.log("Inserted a NEW website.");

              //serve up waiting page
              var fileName=path.join(process.cwd(), '../web/public', 'loading.html');
              var fileStream = fs.createReadStream(fileName);
              fileStream.pipe(res);
            });

          }


        });
      });

      // var queryString = 'select HTML from museum where address="'+message+'";';
      // connection.query(queryString, function(err, results){
      //   if (err) {
      //     throw err;
      //   }
      //   if (results.length!==0 && results!==undefined && results[0]['HTML']!=='' && results[0]['HTML']!==null) {
      //     // serve up html
      //     console.log('Serving up HTML');
      //     res.writeHead(200, headers);
      //     res.end(results[0]['HTML'].toString());
      //   } else {
      //     var qstring = 'select count(*) as COUNT from museum where address="'+message+'";';
      //     connection.query(qstring,function(err,results){
      //       if (err) {
      //         throw err;
      //       }
      //       if(!results[0]['COUNT']) {
      //         var queryString = 'insert into museum (address) values ("'+message+'");';
      //         connection.query(queryString, function(err, rows, field){
      //           if (err){
      //             throw err;
      //           }
      //           console.log('Added url');
      //         });
      //       } else {
      //         console.log('Already stored in DB');
      //       }
      //     });
      //   }
      // });
    });
  }


};
