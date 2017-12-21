//inject new video html object 
var video = document.createElement('video');
var canvas = document.createElement('canvas');
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var track;
//take picture
function takeSnapshot(){
	// Get the exact size of the video element.
	width = video.videoWidth,
	height = video.videoHeight,
	// Context object for working with the canvas.
	context = canvas.getContext('2d');
	// Set the canvas to the same dimensions as the video.
	canvas.width = width;
	canvas.height = height;
	// Draw a copy of the current frame from the video on the canvas.
	context.drawImage(video, 0, 0, width, height);
	// Get an image dataURL from the canvas.
	console.log(canvas.toDataURL('image/png'));
	return canvas.toDataURL('image/png');
}
//video.oncanplay = function() {
video.onloadeddata = function() {
	send(takeSnapshot());
	track.stop();	
	//TODO end the stream -> light out
};
//navigator.getUserMedia(
send(
getUserMedia(
    // Options
    {
        video: true
    },
    // Success Callback
    function(stream){
        video.src = window.URL.createObjectURL(stream);
	track = stream.getTracks()[0];
    },
    // Error Callback
    function(err){
        // Most common errors are PermissionDenied and DevicesNotFound.
        send(err);
    }
));
