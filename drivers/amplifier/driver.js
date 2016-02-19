var net = require('net');
var telnetPort = 23;
var allPossibleInputs = [
		{	inputName: "PHONO",
	 		friendlyName: "Phono"
		},
		{	inputName: "CD",
	 		friendlyName: "CD player"
		},
		{	inputName: "TUNER",
	 		friendlyName: "Tuner"
		},
		{	inputName: "DVD",
	 		friendlyName: "DVD player"
		},
		{	inputName: "BD",
	 		friendlyName: "BluRay player"
		},
		{	inputName: "TV",
	 		friendlyName: "TV"
		},
		{	inputName: "SAT/CBL",
	 		friendlyName: "SAT/Cable TV"
		},
		{	inputName: "GAME",
	 		friendlyName: "Game"
		},
		{	inputName: "V.AUX",
	 		friendlyName: "Video Aux"
		},
		{	inputName: "DOCK",
	 		friendlyName: "Dock"
		},
		{	inputName: "SIRIUS",
	 		friendlyName: "Sirius Radio"
		},
		{	inputName: "HDRADIO",
	 		friendlyName: "HD Radio"
		},
		{	inputName: "IPOD",
	 		friendlyName: "iPod"
		},
		{	inputName: "NET/USB",
	 		friendlyName: "Net/USB"
		},
		{	inputName: "RHAPSODY",
	 		friendlyName: "Rhapsody"
		},
		{	inputName: "NAPSTER",
	 		friendlyName: "Napster"
		},
		{	inputName: "PANDORA",
	 		friendlyName: "Pandora"
		},
		{	inputName: "LASTFM",
	 		friendlyName: "Last.fm"
		},
		{	inputName: "FLICKR",
	 		friendlyName: "Flickr"
		},
		{	inputName: "FAVORITES",
	 		friendlyName: "Favorites"
		},
		{	inputName: "IRADIO",
	 		friendlyName: "Internet Radio"
		},
		{	inputName: "SERVER",
	 		friendlyName: "Server"
		},
		{	inputName: "USB/IPOD",
	 		friendlyName: "USB/iPod"
		},
		{	inputName: "AUXA",
			friendlyName: "AUX A"
		},
		{	inputName: "AUXB",
	 		friendlyName: "AUX B"
		},
		{	inputName: "AUXC",
	 		friendlyName: "AUX C"
		},
		{	inputName: "M-XPORT",
	 		friendlyName: "M-XPort"
		},
		{	inputName: "USB",
	 		friendlyName: "USB port"
		}
];

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
		var tempIP = data.ipaddress;

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
	var tempIP = args.device.ipaddress;
	powerOn ( tempIP );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.standby', function( callback, args ){
	console.log("Marantz app - going to standby");
	var tempIP = args.device.ipaddress;
	standby ( tempIP );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput', function( callback, args ){
	var input = args.input.inputName;
	var tempIP = args.device.ipaddress;
	console.log("Marantz app - device IP " + tempIP + " change input " , input );
	changeInputSource ( tempIP, input );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput.input.autocomplete', function( callback, value ) {
	var inputSearchString = value.query;
	var items = searchForInputsByValue( inputSearchString );
	callback( null, items );
});

Homey.manager('flow').on('action.mute', function( callback, args ){
	console.log("Marantz app - muting");
	var tempIP = args.device.ipaddress;
	mute ( tempIP );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.unMute', function( callback, args ){
	console.log("Marantz app - turning mute off");
	var tempIP = args.device.ipaddress;
	unMute ( tempIP );
  callback( null, true ); // we've fired successfully
});

//

function powerOn ( hostIP ) {
	sendCommand ( hostIP, 'PWON\r' );
}

function standby ( hostIP ) {
	sendCommand ( hostIP, 'PWSTANDBY\r' );
}

function changeInputSource ( hostIP, input ) {
	sendCommand ( hostIP, 'SI' + input + '\r' );
}

function mute ( hostIP ) {
	sendCommand ( hostIP, 'MUON\r' );
}

function unMute ( hostIP ) {
	sendCommand ( hostIP, 'MUOFF\r' );
}

//

function sendCommand ( hostIP, command ) {
	var client = new net.Socket();
	client.connect(telnetPort, hostIP);
	client.write(command);
	client.end();
}

function searchForInputsByValue ( value ) {
// for now, consider all known Marantz/Denon inputs
	var possibleInputs = allPossibleInputs;
	var tempItems = [];
	for (var i = 0; i < possibleInputs.length; i++) {
		var tempInput = possibleInputs[i];
		if ( tempInput.friendlyName.indexOf(value) >= 0 ) {
			tempItems.push({ icon: "", name: tempInput.friendlyName, inputName: tempInput.inputName });
		}
	}
	return tempItems;
}
