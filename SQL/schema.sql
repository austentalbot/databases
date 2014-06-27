CREATE DATABASE chat;

USE chat;

CREATE TABLE messages (
  /* Describe your table here.*/
  (message VARCHAR(300), userID int(11), roomID int(11), time TIMESTAMP(14), messageID int(11) NOT NULL auto_increment, PRIMARY KEY (messageID))
);

CREATE TABLE users (
  (user VARCHAR(50), userID int(11) NOT NULL auto_increment, PRIMARY KEY(userID))
);

CREATE TABLE rooms (
  (room VARCHAR(50), roomID int(11) NOT NULL auto_increment, PRIMARY KEY(roomID))
);


/*  Execute this file from the command line by typing:
 *    mysql < schema.sql
 *  to create the database and the tables.*/




