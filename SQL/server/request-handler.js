var url = require('url');
var _ = require('underscore');
var fs=require('fs');
var mysql=require('mysql');
var storage = [];

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'chat'
});

connection.connect();

module.exports = {
  handleRequest: function(request, response) {
    var statusCode = 404;
    var headers = module.exports.defaultCorsHeaders;
    headers['Content-Type'] = "text/plain";
    var responseText='';
    var req=url.parse(request.url, true);

    //only peform these requests for certain paths
    if (req.pathname.slice(0, 8)==='/classes') {
      var parameters=req.pathname.slice(1).split('/');
      var query=req.query;
      if (parameters[1]==='room') {
        query['roomname']=parameters[2];
      }
      //OPTIONS
      if(request.method === "OPTIONS") {
        statusCode=200;
        response.writeHead(statusCode, headers);
        response.end(responseText);
      //GET
      } else if (request.method === 'GET') {
        module.exports.returnResults(query, response);
      //POST
      } else if (request.method === 'POST') {
        statusCode=201;
        var body = "";
        //since data comes in a stream, we need to concatenate and return once it has all loaded
        request.on('data', function (chunk) {
          body += chunk;
        });
        //adjust atributes and add to storage once all data has come in
        request.on('end', function () {
          var post = JSON.parse(body);
          post.id = storage.length;
          post.createdAt = new Date();
          if (query['roomname'] !== undefined) {
            post.roomname = query['roomname']
          }
          storage[post.id] = post;
          //load into SQL
          // connection.connect()
          var SQL='insert into messages (message, userID, roomID, time) values("'+post.text+'", 1, 1, NOW());'
          connection.query(SQL, function(err, results) {
            if (err) {
              throw err;
            }
            // connection.end();
          });
          //end SQL load
          response.writeHead(statusCode, headers);
          response.end(responseText);
        });
      }

    //load client-side html at main server address
    } else if (req.pathname==='/') {
      headers['Content-Type'] = "text/html";

      //read in the file and send (async)
      fs.readFile("./client/index.html", {encoding: 'utf8'}, function (err,data) {
        if (err) {
          throw err;
        }
        statusCode=200;
        response.writeHead(statusCode, {'Content-Type': 'text/html'});
        response.end(data);
      });
    } else {
      //serve other files - use for dependencies
      //handle css and js files differently
      if (req.pathname.slice(-3) === 'css') {
        var contentType = "text/css";
      } else {
        var contentType = "text/javscript";
      }

      //read file and send
      fs.readFile("./client"+req.pathname, {encoding: 'utf8'}, function (err,data) {
        if (err) {
          console.log('there is an error')
          throw err;
        }
        statusCode=200;
        response.writeHead(statusCode, {'Content-Type': contentType});
        response.end(data);
      });
    }

  },

  returnResults: function(queryObj, response) {
    (function(queryObj, response){
      var headers = module.exports.defaultCorsHeaders;
      var roomFilter='where chat.rooms.room="lobby" ';
      if (queryObj.roomname!==undefined) {
        roomFilter='where chat.rooms.room="'+queryObj.roomname+'" ';
      }
      headers['Content-Type'] = "application/json";
      var SQL='select user, room, message, messageID, time from chat.messages '+ 
        'join chat.users on chat.messages.userID=chat.users.userID '+
        'join chat.rooms on chat.messages.roomID=chat.rooms.roomID '+
        roomFilter+
        'order by time desc limit 100;';
      var resultsObj={'results':[]};
      headers['Content-Type'] = "application/json";

      connection.query(SQL, function(err, results) {
        if (err) {
          throw err;
        }
        for (var i=0; i<results.length; i++) {
          var result=results[i];
          var chat={};
          chat.text=result.message;
          chat.username=result.user;
          chat.roomname=result.room;
          chat.id=result.messageID;
          chat.createdAt=result.time;
          resultsObj.results.push(chat);
        }
        response.writeHead(200, headers);
        var responseText=JSON.stringify(resultsObj);
        response.end(responseText);
      });
    })(queryObj, response);
  },

  defaultCorsHeaders: {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, accept",
    "access-control-max-age": 10 // Seconds.
  }
};
