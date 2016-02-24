var net = require('net');
var tempIP = '';
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

	console.log( "Marantz app - list_devices tempIP is", tempIP );

		var devices = [{
			data: {
				id				: tempIP,
				ipaddress : tempIP
			},
			name: 'Marantz amp'
		}];

		callback( null, devices );

	});

// this is called when the user presses save settings button in start.html

	socket.on('get_devices', function( data, callback ) {

		// Set passed pair settings in variables
		tempIP = data.ipaddress;
		console.log ( "Marantz app - got get_devices from front-end, tempIP =", tempIP );

		// FIXME: should check if IP leads to an actual Marantz device

		// assume IP is OK and continue
		socket.emit ( 'continue', null );

	});

	socket.on('disconnect', function(){
			console.log("Marantz app - User aborted pairing, or pairing is finished");
	})
}

// flow action handlers

Homey.manager('flow').on('action.powerOn', function( callback, args ){
	var tempIP = args.device.ipaddress;
	var zone = args.zone;
	console.log ( "Marantz app - flow action powerOn, IP " + tempIP );
	powerOn ( tempIP, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.powerOff', function( callback, args ){
	var tempIP = args.device.ipaddress;
	var zone = args.zone;
	powerOff ( tempIP, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput', function( callback, args ){
	var input = args.input.inputName;
	var zone = args.zone;
	var tempIP = args.device.ipaddress;
	changeInputSource ( tempIP, zone, input );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput.input.autocomplete', function( callback, value ) {
	var inputSearchString = value.query;
	var items = searchForInputsByValue( inputSearchString );
	callback( null, items );
});

Homey.manager('flow').on('action.mute', function( callback, args ){
	var tempIP = args.device.ipaddress;
	var zone = args.zone;
	mute ( tempIP, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.unMute', function( callback, args ){
	var tempIP = args.device.ipaddress;
	var zone = args.zone;
	unMute ( tempIP, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.setVolume', function( callback, args ){
	var tempIP = args.device.ipaddress;
	var zone = args.zone;
	var targetVolume = args.volume;
	setVolume ( tempIP, zone, targetVolume );
  callback( null, true ); // we've fired successfully
});

//

function powerOn ( hostIP, zone ) {
	// supported zones: "Whole unit" (default), "Main Zone", "Zone2"
	var command = 'PWON\r';
	switch (zone) {
		case 'Whole unit':
			command = 'PWON\r';
			break;
		case 'Main Zone':
			command = 'ZMON\r';
			break;
		case 'Zone2':
			command = 'Z2ON\r'
			break;
	}
	sendCommand ( hostIP, command );
}

function powerOff ( hostIP, zone ) {
	// supported zones: "Whole unit" (default), "Main Zone", "Zone2"
	var command = 'PWSTANDBY\r';
	switch (zone) {
		case 'Whole unit':
			command = 'PWSTANDBY\r';
			break;
		case 'Main Zone':
			command = 'ZMOFF\r';
			break;
		case 'Zone2':
			command = 'Z2OFF\r'
			break;
	}
	sendCommand ( hostIP, command );
}

function changeInputSource ( hostIP, zone, input ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
		var sourceZone = 'SI';
		switch (zone) {
			case 'Main Zone':
				sourceZone = 'SI';
				break;
			case 'Zone2':
				sourceZone = 'Z2';
				break;
			case 'Zone3':
				sourceZone = 'Z3';
				break;
		}
		var command = sourceZone+input+'\r';
		sendCommand ( hostIP, command );
}

function mute ( hostIP, zone ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	var command = 'MUON\r';
	switch (zone) {
		case 'Main Zone':
			command = 'MUON\r';
			break;
		case 'Zone2':
			command = 'Z2MUON\r';
			break;
		case 'Zone3':
			command = 'Z3MUON\r'
			break;
	}
	sendCommand ( hostIP, command );
}

function unMute ( hostIP, zone ) {
	// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	var command = 'MUOFF\r';
	switch (zone) {
		case 'Main Zone':
			command = 'MUOFF\r';
			break;
		case 'Zone2':
			command = 'Z2MUOFF\r';
			break;
		case 'Zone3':
			command = 'Z3MUOFF\r'
			break;
	}
	sendCommand ( hostIP, command );
}

function setVolume ( hostIP, zone, targetVolume ) {
// volume ranges from 00 to 99
// apparently half steps are possible but not used here, eg 805 is 80.5
// according to Marantz protocol some models have 99 as --, some have 00 as --
	var asciiVolume = "0"+targetVolume.toString();
	var asciiVolume = asciiVolume.slice(-2);
// supported zones: "Main Zone" (default), "Zone2", "Zone3"
	var volumeZone = 'MV';
	switch (zone) {
		case 'Main Zone':
			volumeZone = 'MV';
			break;
		case 'Zone2':
			volumeZone = 'Z2';
			break;
		case 'Zone3':
			volumeZone = 'Z3';
			break;
	}
	var command = volumeZone+asciiVolume+'\r';
	sendCommand ( hostIP, command );
}

//

function sendCommand ( hostIP, command ) {
	console.log ( "Marantz app - sending "+command+"\n to "+hostIP );
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
