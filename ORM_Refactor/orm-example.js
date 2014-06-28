/* You'll need to
 * npm install sequelize
 * before running this example. Documentation is at http://sequelizejs.com/
 */

var Sequelize = require("sequelize");
var sequelize = new Sequelize("chatter", "root", "");
/* TODO this constructor takes the database name, username, then password.
 * Modify the arguments if you need to */

/* first define the data structure by giving property names and datatypes
 * See http://sequelizejs.com for other datatypes you can use besides STRING. */
var User = sequelize.define('User', {
  username: Sequelize.STRING
});

var Message = sequelize.define('Message', {
  userid: Sequelize.INTEGER,
  text: Sequelize.STRING,
  roomname: Sequelize.STRING
});

/* .sync() makes Sequelize create the database table for us if it doesn't
 *  exist already: */
User.sync().success(function() {
  /* This callback function is called once sync succeeds. */

  // now instantiate an object and save it:
  var newUser = User.build({username: "Jean Valjean"});
  newUser.save().success(function() {

    /* This callback function is called once saving succeeds. */

    // Retrieve objects from the database:
    User.findAll({ where: {username: "Jean Valjean"} }).success(function(usrs) {
      // This function is called back with an array of matches.
      for (var i = 0; i < usrs.length; i++) {
        console.log(usrs[i].username + " exists");
      }
    });
  });
});

// User.hasMany(Message);
// Message.belongsTo(User);

// User.create({}).complete(function(err, user) {
//   Message.create({}).complete(function(err, message) {
//     user.getMessage().complete(function(err, _target) {
//       console.log(_target.values);
//     });
//   });
// });

/* .sync() makes Sequelize create the database table for us if it doesn't
 *  exist already: */
 /*
var userName="Austen Talbot";

// //make sure user is added
User.sync().success(function() {
  var newUser=User.build({username: userName});
  newUser.save().success(function() {
    //find user name
    User.find({where: {username: userName}}).success(function(user) {
      user['dataValues']['id'];

      //add message
      Message.sync().success(function() {
        var newMessage = Message.build({text: "this is my message", 
          userid: user['dataValues']['id'],
          roomname: "lobby"
        });

        newMessage.save().success(function() {
          console.log('saved');
        });
      });
    });    
  });
});
*/

// Message.findAll({limit: 100, order: 'createdAt desc'}).success(function(results) {
//   for (var i=0; i<results.length; i++) {
//     console.log(results[i]['dataValues']);
//   }
// });


