"use strict";

// We need network functions.
var net = require('net');
// Temporarily store the device's IP address and name. For later use, it gets added to the device's settings
var tempIP = '';
var tempDeviceName = '';
// Variable to hold responses from the AVR
var receivedData = "";
// The Denon/Marantz IP network interface always uses port 23, which is known as the telnet port.
var telnetPort = 23;
// a list of devices, with their 'id' as key
// it is generally advisable to keep a list of
// paired and active devices in your driver's memory.
var devices = {};
// All known inputs for supported Denon/Marantz AV receivers and a more friendly name to use.
// If you find your favorite input missing, please file a bug on the GitHub repository.
var allPossibleInputs = [
		{	inputName: "PHONO",
	 		friendlyName: "Phono"
		},
		{	inputName: "CD",
	 		friendlyName: "CD player"
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
		{	inputName: "SAT",
			friendlyName: "Satellite"
		},
		{	inputName: "MPLAY",
			friendlyName: "Media Player"
		},
		{	inputName: "VCR",
			friendlyName: "VCR"
		},
		{	inputName: "GAME",
	 		friendlyName: "Game"
		},
		{	inputName: "V.AUX",
	 		friendlyName: "Video Aux"
		},
		{	inputName: "TUNER",
	 		friendlyName: "Tuner"
		},
		{	inputName: "DOCK",
	 		friendlyName: "Dock"
		},
		{	inputName: "HDRADIO",
			friendlyName: "HD Radio"
		},
		{	inputName: "SIRIUS",
	 		friendlyName: "Sirius Radio"
		},
		{	inputName: "SPOTIFY",
			friendlyName: "Spotify"
		},
		{	inputName: "SIRIUSXM",
	 		friendlyName: "SiriusXM"
		},
		{	inputName: "RHAPSODY",
	 		friendlyName: "Rhapsody"
		},
		{	inputName: "PANDORA",
	 		friendlyName: "Pandora"
		},
		{	inputName: "NAPSTER",
	 		friendlyName: "Napster"
		},
		{	inputName: "LASTFM",
	 		friendlyName: "Last.fm"
		},
		{	inputName: "FLICKR",
	 		friendlyName: "Flickr"
		},
		{	inputName: "IRADIO",
	 		friendlyName: "Internet Radio"
		},
		{	inputName: "SERVER",
	 		friendlyName: "Server"
		},
		{	inputName: "FAVORITES",
	 		friendlyName: "Favorites"
		},
		{	inputName: "CDR",
	 		friendlyName: "CDR"
		},
		{	inputName: "AUX1",
	 		friendlyName: "Aux 1"
		},
		{	inputName: "AUX2",
	 		friendlyName: "Aux 2"
		},
		{	inputName: "AUX3",
	 		friendlyName: "Aux 3"
		},
		{	inputName: "AUX4",
	 		friendlyName: "Aux 4"
		},
		{	inputName: "AUX5",
	 		friendlyName: "Aux 5"
		},
		{	inputName: "AUX6",
	 		friendlyName: "Aux 6"
		},
		{	inputName: "AUX7",
	 		friendlyName: "Aux 7"
		},
		{	inputName: "NET",
	 		friendlyName: "Net"
		},
		{	inputName: "NET/USB",
	 		friendlyName: "Net/USB"
		},
		{	inputName: "BT",
	 		friendlyName: "Bluetooth"
		},
		{	inputName: "M-XPORT",
	 		friendlyName: "M-XPort"
		},
		{	inputName: "USB/IPOD",
	 		friendlyName: "USB/iPod"
		},
		{	inputName: "USB",
	 		friendlyName: "USB port"
		},
		{	inputName: "IPD",
	 		friendlyName: "iPod direct start playback"
		},
		{	inputName: "IRP",
	 		friendlyName: "Internet Radio Recent Play"
		},
		{	inputName: "FVP",
	 		friendlyName: "Online Music Favorites Play"
		},
		{	inputName: "OTP",
	 		friendlyName: "One Touch Play"
		},
		{	inputName: "IPOD",
	 		friendlyName: "iPod"
		},
		{	inputName: "AUXA",
			friendlyName: "Aux A"
		},
		{	inputName: "AUXB",
	 		friendlyName: "Aux B"
		},
		{	inputName: "AUXC",
	 		friendlyName: "Aux C"
		}
];

// init gets run at the time the app is loaded. We get the already added devices then need to run the callback when done.
module.exports.init = function( devices_data, callback ) {
	devices_data.forEach(function(device_data){
		Homey.log('Marantz app - init device: ' + JSON.stringify(device_data));
	  initDevice( device_data );
	})
	//tell Homey we're happy to go
	  callback();
}

// start of pairing functions
module.exports.pair = function( socket ) {
// socket is a direct channel to the front-end

// this method is run when Homey.emit('list_devices') is run on the front-end
// which happens when you use the template `list_devices`
	socket.on('list_devices', function( data, callback ) {

		Homey.log( "Marantz app - list_devices data: " + JSON.stringify(data));
// tempIP and tempDeviceName we got from when get_devices was run (hopefully?)

		var newDevices = [{
			data: {
				id				: tempIP
			},
			name: tempDeviceName,
			settings: { "settingIPAddress": tempIP } // initial settings
		}];

		callback( null, newDevices );
	});


// this is called when the user presses save settings button in start.html
	socket.on('get_devices', function( data, callback ) {

		// Set passed pair settings in variables
		tempIP = data.ipaddress;
		tempDeviceName = data.deviceName;
		Homey.log ( "Marantz app - got get_devices from front-end, tempIP =", tempIP, " tempDeviceName = ", tempDeviceName );
// FIXME: should check if IP leads to an actual Marantz device
// assume IP is OK and continue, which will cause the front-end to run list_amplifiers which is the template list_devices
		socket.emit ( 'continue', null );
	});

		socket.on('disconnect', function() {
			console.log("Marantz app - Pairing is finished (done or aborted)");
	  })
}
// end pair

module.exports.added = function( device_data, callback ) {
    // run when a device has been added by the user (as of v0.8.33)
		Homey.log("Marantz app - device added: " + JSON.stringify(device_data));
		// update devices data array
    initDevice( device_data );
		Homey.log('Marantz app - add done. devices =' + JSON.stringify(devices));
		callback( null, true );
}

module.exports.renamed = function( device_data, new_name ) {
    // run when the user has renamed the device in Homey.
    // It is recommended to synchronize a device's name, so the user is not confused
    // when it uses another remote to control that device (e.g. the manufacturer's app).
		Homey.log("Marantz app - device renamed: " + JSON.stringify(device_data) + " new name: " + new_name);
		// update the devices array we keep
		devices[device_data.id].data.name = new_name;
}

module.exports.deleted = function( device_data ) {
    // run when the user has deleted the device from Homey
		Homey.log("Marantz app - device deleted: " + JSON.stringify(device_data));
		// remove from the devices array we keep
    delete devices[ device_data.id ];
}

// handling settings (wrench icon in devices)
module.exports.settings = function( device_data, newSettingsObj, oldSettingsObj, changedKeysArr, callback ) {
    // run when the user has changed the device's settings in Homey.
    // changedKeysArr contains an array of keys that have been changed, for your convenience :)

    // always fire the callback, or the settings won't change!
    // if the settings must not be saved for whatever reason:
    // callback( "Your error message", null );
    // else callback( null, true );

		Homey.log ('Marantz app - Settings were changed: ' + JSON.stringify(device_data) + ' / ' + JSON.stringify(newSettingsObj) + ' / old = ' + JSON.stringify(oldSettingsObj) + ' / changedKeysArr = ' + JSON.stringify(changedKeysArr));

		try {
      changedKeysArr.forEach(function (key) {
					switch (key) {
						case 'settingIPAddress':
							Homey.log ('Marantz app - IP address changed to ' + newSettingsObj.settingIPAddress);
							// FIXME: check if IP is valid, otherwise return callback with an error
							break;
					}
      })
      callback(null, true)
    } catch (error) {
      callback(error)
    }

}

// capabilities

module.exports.capabilities = {
    onoff: {

        get: function( device_data, callbackCapability ){

					Homey.log("Marantz app - getting device on/off status of " + device_data.id);
					var command = 'PW?\r';
					sendCommandToDevice ( device_data, command, function(receivedData) {
						Homey.log("Marantz app - got callback, receivedData: " + receivedData);
// if the response contained "PWON", the AVR was on. Else it was probably in standby.
						if (receivedData.indexOf("PWON") >= 0) {
							Homey.log("Marantz app - telling capability power is on");
							callbackCapability (null, true);
						}	else {
							Homey.log("Marantz app - telling capability power is off");
							callbackCapability (null, false);
						}
					} );
        },

        set: function( device_data, turnon, callbackCapability ) {

	        Homey.log('Marantz app - Setting device_status of ' + device_data.id + ' to ' + turnon);

					if (turnon) {
						var command = 'PWON\r';
						sendCommandToDevice ( device_data, command );
						callbackCapability (null, true);

					} else {
						var command = 'PWSTANDBY\r';
						sendCommandToDevice ( device_data, command );
						callbackCapability (null, true);

					}
        }
    }
}

// end capabilities

// start flow action handlers

Homey.manager('flow').on('action.powerOn', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	powerOn ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.powerOff', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	powerOff ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput', function( callback, args ){
	var input = args.input.inputName;
	var zone = args.zone;
	var device = args.device;
	changeInputSource ( device, zone, input );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.changeInput.input.autocomplete', function( callback, value ) {
	var inputSearchString = value.query;
	var items = searchForInputsByValue( inputSearchString );
	callback( null, items );
});

Homey.manager('flow').on('action.mute', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	mute ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.unMute', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	unMute ( device, zone );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.setVolume', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	var targetVolume = args.volume;
	setVolume ( device, zone, targetVolume );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.setVolumeStep', function( callback, args ){
	var device = args.device;
	var zone = args.zone;
	var targetVolume = args.volume;
	setVolumeStep ( device, zone, targetVolume );
  callback( null, true ); // we've fired successfully
});

Homey.manager('flow').on('action.customCommand', function( callback, args ){
	var device = args.device;
	var customCommand = args.command+'\r';
	sendCommandToDevice ( device, customCommand );
  callback( null, true ); // we've fired successfully
});

//

function powerOn ( device, zone ) {
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
	sendCommandToDevice ( device, command );
}

function powerOff ( device, zone ) {
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
	sendCommandToDevice ( device, command );
}

function changeInputSource ( device, zone, input ) {
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
		sendCommandToDevice ( device, command );
}

function mute ( device, zone ) {
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
	sendCommandToDevice ( device, command );
}

function unMute ( device, zone ) {
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
	sendCommandToDevice ( device, command );
}

function setVolume ( device, zone, targetVolume ) {
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
	sendCommandToDevice ( device, command );
}

function setVolumeStep ( device, zone, targetVolume ) {
// volume ranges from 00 to 99
// apparently half steps are possible but not used here, eg 805 is 80.5
// according to Marantz protocol some models have 99 as --, some have 00 as --
var asciiVolume = null;
if(targetVolume > 0) {
	asciiVolume = 'UP';
}
if(targetVolume < 0) {
	asciiVolume = 'DOWN';
}
	if(asciiVolume !== null) {
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
		for(var i = 0; i < Math.abs(targetVolume); i++) {
			setTimeout(function(device, command) {

				sendCommandToDevice ( device, command );
			}, (i * 750), device, command);
		}
	}
}

//

function sendCommandToDevice ( device, command, callbackCommand ) {
	module.exports.getSettings (device, function(err, settings){
		Homey.log ( "Marantz app - got settings "+JSON.stringify(settings) );
		tempIP = settings.settingIPAddress;
		sendCommand ( tempIP, command, callbackCommand );
	});
}

function sendCommand ( hostIP, command, callbackCommand ) {
	// clear variable that holds data received from the AVR
	receivedData = "";
	// for logging strip last char which will be the newline \n char
	var displayCommand=command.substring(0, command.length -1);
	Homey.log ( "Marantz app - sending "+displayCommand+" to "+hostIP );
	var client = new net.Socket();
	client.on('error', function(err){
	    Homey.log("Marantz app - IP socket error: "+err.message);
	})
	client.connect(telnetPort, hostIP);
	client.write(command);

// get a response
	client.on('data', function(data){
			var tempData = data.toString().replace("\r", ";");
			Homey.log("Marantz app - got: " + tempData);
			receivedData += tempData;
	})

// after a delay, close connection
	setTimeout ( function() {
		receivedData = receivedData.replace("\r", ";")
		Homey.log("Marantz app - closing connection, receivedData: " + receivedData );
		client.end();
// if we got a callback function, call it with the receivedData
		if (callbackCommand && typeof(callbackCommand) == "function") {
			callbackCommand(receivedData);
		}
  }, 1000);
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

// a helper method to add a device to the devices list
function initDevice( device_data ) {
    devices[ device_data.id ] = {};
    devices[ device_data.id ].state = { onoff: true };
    devices[ device_data.id ].data = device_data;
}
