/* Import node's http module: */
var http = require("http");
var url = require('url');
var handleRequest = require('./server/request-handler.js').handleRequest;

var port = 3000;
var ip = "127.0.0.1";

var server = http.createServer(handleRequest);
console.log("Listening on http://" + ip + ":" + port);
server.listen(port, ip);
