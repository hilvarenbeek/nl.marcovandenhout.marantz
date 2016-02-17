var net = require('net');
var telnetPort = 23;

module.exports.pair = function( socket ) {
	// socket is a direct channel to the front-end

	// this method is run when Homey.emit('list_devices') is run on the front-end
	// which happens when you use the template `list_devices`
	socket.on('list_devices', function( data, callback ) {

		var devices = [{
			data: {
				id				: tempIP,
				ipaddress : tempIP
			},
			name: 'Marantz amp'
		}];

		callback( null, devices );

	});

	socket.on('get_devices', function( data, callback ) {

		// Set passed pair settings in variables
		tempIP = data.ipaddress;

		// should check if IP leads to an actual Marantz device

		// assume IP is OK and continue
		socket.emit ( 'continue', null );

	});

	socket.on('disconnect', function(){
			console.log("Marantz app - User aborted pairing, or pairing is finished");
	})

}

Homey.manager('flow').on('action.powerOn', function( callback, args ){
		console.log("Marantz app - powerOn id "+args.device.id);
		tempIP = args.device.ipaddress;
		powerOn ( tempIP );
    callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.standby', function( callback, args ){
		console.log("Marantz app - standby ");
		tempIP = args.device.ipaddress;
		standby ( tempIP );
    callback( null, true ); // we've fired successfully
});


function powerOn ( hostIP ) {
	var client = new net.Socket();
	client.connect(telnetPort, hostIP);
	client.write('PWON\r');
	client.end();
}

function standby ( hostIP ) {
	var client = new net.Socket();
	console.log("Sending standby command to "+hostIP+":"+telnetPort);
	client.connect(telnetPort, hostIP);
	client.write('PWSTANDBY\r');
	client.end();
}
