var url = require('url');
var _ = require('underscore');
var fs=require('fs');

var Sequelize = require("sequelize");
var sequelize = new Sequelize("chat2", "root", "");


sequelize
  .authenticate()
  .complete(function(err) {
    if (!!err) {
      console.log('Unable to connect to the database:', err)
    } else {
      console.log('Connection has been established successfully.')
    }
  });

var User = sequelize.define('User', {
  username: Sequelize.STRING
});

var Message = sequelize.define('Message', {
  userid: Sequelize.INTEGER,
  text: Sequelize.STRING,
  roomname: Sequelize.STRING
});

//clear out tables
// User.sync({force: true});
// Message.sync({force: true});

User.hasMany(Message, {foreignKey: 'userid'});
Message.belongsTo(User, {foreignKey: 'userid'});

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
          // post.id = storage.length;
          post.createdAt = new Date();
          if (query['roomname'] !== undefined) {
            post.roomname = query['roomname']
          }
          // storage[post.id] = post;

          User.sync().success(function() {
            var newUser=User.build({username: post.username});
            newUser.save().success(function() {
              //find user name
              User.find({where: {username: post.username}}).success(function(user) {
                user['dataValues']['id'];

                //add message
                Message.sync().success(function() {
                  var newMessage = Message.build({text: post.text, 
                    userid: user['dataValues']['id'],
                    roomname: post.roomname || 'lobby'
                  });

                  newMessage.save().success(function() {
                    console.log('saved');
                  });
                });
              });    
            });
          });
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
    var headers = module.exports.defaultCorsHeaders;
    headers['Content-Type'] = "application/json";
    var resultsObj={'results':[]};
    
    var roomFilter='lobby';
    if (queryObj.roomname!==undefined) {
      roomFilter=queryObj.roomname;
    }

    Message.findAll({limit: 100, order: 'createdAt desc', where:{roomname: roomFilter}, include: [User]}).success(function(results) {
      for (var i=0; i<results.length; i++) {
        var result=results[i]['dataValues'];
        var chat={};
        chat.text=result.text;
        chat.username=result.user.username;
        chat.roomname=result.roomname;
        chat.id=result.id;
        chat.createdAt=result.createdAt;

        resultsObj.results.push(chat);

      }

      response.writeHead(200, headers);
      var responseText=JSON.stringify(resultsObj);
      response.end(responseText);
    });

  },

  defaultCorsHeaders: {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, accept",
    "access-control-max-age": 10 // Seconds.
  }
};
